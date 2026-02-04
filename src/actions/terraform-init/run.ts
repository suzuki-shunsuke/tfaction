import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";

import * as aqua from "../../aqua";
import * as git from "../../lib/git";
import * as commit from "../../commit";

// Check if this is a pull request event
export const isPullRequestEvent = (eventName: string): boolean => {
  return eventName === "pull_request" || eventName.startsWith("pull_request_");
};

export type RunInput = {
  isPullRequest: boolean;
  workingDir: string;
  tfCommand: string;
  providersLockOpts: string;
  githubToken: string;
  workspace: string;
  gitRootDir: string;
  terragruntRunAvailable: boolean;
  executor: aqua.Executor;
  serverRepository: string;
  appId: string;
  appPrivateKey: string;
};

export const run = async (input: RunInput): Promise<void> => {
  if (!input.isPullRequest) {
    // Non-PR: just run init with github-comment
    await input.executor.exec(input.tfCommand, ["init", "-input=false"], {
      cwd: input.workingDir,
      comment: {
        token: input.githubToken,
      },
    });
  } else {
    // PR: init with lock file handling
    const lockFile = input.workingDir
      ? path.join(input.workingDir, ".terraform.lock.hcl")
      : ".terraform.lock.hcl";
    const existedBefore = fs.existsSync(lockFile);

    // terraform init (try without upgrade first, then with upgrade on failure)
    core.startGroup(`${input.tfCommand} init`);
    const initResult = await input.executor.exec(
      input.tfCommand,
      ["init", "-input=false"],
      {
        cwd: input.workingDir,
        ignoreReturnCode: true,
      },
    );
    if (initResult !== 0) {
      await input.executor.exec(
        input.tfCommand,
        ["init", "-input=false", "-upgrade"],
        {
          cwd: input.workingDir,
          comment: {
            token: input.githubToken,
          },
        },
      );
    }
    core.endGroup();

    const lockArgs = input.providersLockOpts
      .split(/\s+/)
      .filter((s) => s.length > 0);
    await input.executor.exec(
      input.tfCommand,
      (input.terragruntRunAvailable ? ["run", "--"] : []).concat(
        ["providers", "lock"],
        lockArgs,
      ),
      {
        cwd: input.workingDir,
        group: input.terragruntRunAvailable
          ? `${input.tfCommand} run -- providers lock`
          : `${input.tfCommand} providers lock`,
        comment: {
          token: input.githubToken,
        },
      },
    );

    // Check if lock file changed
    if (
      !existedBefore ||
      (await git.hasFileChanged(".terraform.lock.hcl", input.workingDir))
    ) {
      // Commit the change
      const lockFileFromGitRootDir = path.relative(
        input.gitRootDir,
        path.join(input.workspace, lockFile),
      );
      await commit.create({
        commitMessage: "chore: update .terraform.lock.hcl",
        githubToken: input.githubToken,
        rootDir: input.gitRootDir,
        files: new Set([lockFileFromGitRootDir]),
        serverRepository: input.serverRepository,
        appId: input.appId,
        appPrivateKey: input.appPrivateKey,
      });
    }
  }

  await input.executor.exec(
    input.tfCommand,
    input.terragruntRunAvailable ? ["run", "--", "providers"] : ["providers"],
    {
      cwd: input.workingDir,
      group: input.terragruntRunAvailable
        ? `${input.tfCommand} run -- providers`
        : `${input.tfCommand} providers`,
    },
  );
};
