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
  isModule?: boolean;
  /** absolute path to the working directory */
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
  secrets?: Record<string, string>;
};

export const run = async (input: RunInput): Promise<void> => {
  if (!input.isPullRequest) {
    // Non-PR: just run init with github-comment
    await input.executor.exec(input.tfCommand, ["init", "-input=false"], {
      cwd: input.workingDir,
      secretEnvs: input.secrets,
      comment: {
        token: input.githubToken,
      },
    });
  } else {
    // PR: init with lock file handling
    /** absolute path to the lock file */
    const lockFile = path.join(input.workingDir, ".terraform.lock.hcl");
    const existedBefore = fs.existsSync(lockFile);
    // For modules, save the original content to restore later
    const contentBefore =
      input.isModule && existedBefore
        ? fs.readFileSync(lockFile, "utf8")
        : undefined;

    // terraform init (try without upgrade first, then with upgrade on failure)
    const initResult = await input.executor.exec(
      input.tfCommand,
      ["init", "-input=false"],
      {
        cwd: input.workingDir,
        ignoreReturnCode: true,
        secretEnvs: input.secrets,
        group: "${input.tfCommand} init",
      },
    );
    if (initResult !== 0) {
      await input.executor.exec(
        input.tfCommand,
        ["init", "-input=false", "-upgrade"],
        {
          cwd: input.workingDir,
          secretEnvs: input.secrets,
          group: "${input.tfCommand} init -upgrade",
          comment: {
            token: input.githubToken,
          },
        },
      );
    }

    if (input.isModule) {
      // Module: restore/delete lock file, skip providers lock
      if (!existedBefore) {
        // Lock file didn't exist before init - delete if created
        if (fs.existsSync(lockFile)) {
          fs.unlinkSync(lockFile);
        }
      } else if (contentBefore !== undefined) {
        // Lock file existed before - revert if modified
        const currentContent = fs.readFileSync(lockFile, "utf8");
        if (currentContent !== contentBefore) {
          fs.writeFileSync(lockFile, contentBefore);
        }
      }
    } else {
      // Non-module: providers lock + commit if changed
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
          lockFile,
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
        throw new Error(".terraform.lock.hcl is updated");
      }
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
