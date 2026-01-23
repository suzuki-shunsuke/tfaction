import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";
import * as path from "path";

import { getTargetConfig } from "../get-target-config";
import * as lib from "../lib";
import * as env from "../lib/env";
import * as input from "../lib/input";
import * as git from "../lib/git";
import * as aqua from "../aqua";
import * as commit from "../commit";

// Check if this is a pull request event
const isPullRequestEvent = (): boolean => {
  const eventName = github.context.eventName;
  return eventName === "pull_request" || eventName.startsWith("pull_request_");
};

export const main = async () => {
  const githubToken = input.getRequiredGitHubToken();
  const config = await lib.getConfig();

  const targetConfig = await getTargetConfig(
    {
      target: env.tfactionTarget,
      workingDir: env.tfactionWorkingDir,
      isApply: env.getIsApply(),
      jobType: env.getJobType(),
    },
    config,
  );

  const workingDir = path.join(
    config.git_root_dir,
    targetConfig.working_directory,
  );
  const tfCommand = targetConfig.terraform_command;
  const providersLockOpts = targetConfig.providers_lock_opts;

  const executor = await aqua.NewExecutor({
    githubToken,
    cwd: workingDir,
  });

  const terragruntRunAvailable =
    tfCommand === "terragrunt" &&
    (await aqua.checkTerrgruntRun(executor, workingDir));

  if (!isPullRequestEvent()) {
    // Non-PR: just run init with github-comment
    await executor.exec(
      "github-comment",
      ["exec", "--", tfCommand, "init", "-input=false"],
      {
        cwd: workingDir,
        env: {
          GITHUB_TOKEN: githubToken,
        },
      },
    );
  } else {
    // PR: init with lock file handling
    const lockFile = workingDir
      ? path.join(workingDir, ".terraform.lock.hcl")
      : ".terraform.lock.hcl";
    const existedBefore = fs.existsSync(lockFile);

    // terraform init (try without upgrade first, then with upgrade on failure)
    core.startGroup(`${tfCommand} init`);
    const initResult = await executor.exec(
      tfCommand,
      ["init", "-input=false"],
      {
        cwd: workingDir,
        ignoreReturnCode: true,
      },
    );
    if (initResult !== 0) {
      await executor.exec(
        "github-comment",
        ["exec", "--", tfCommand, "init", "-input=false", "-upgrade"],
        {
          cwd: workingDir,
          env: {
            GITHUB_TOKEN: githubToken,
          },
        },
      );
    }
    core.endGroup();

    core.startGroup(
      terragruntRunAvailable
        ? `${tfCommand} run -- providers lock`
        : `${tfCommand} providers lock`,
    );
    const lockArgs = providersLockOpts.split(/\s+/).filter((s) => s.length > 0);
    await executor.exec(
      "github-comment",
      ["exec", "--", tfCommand].concat(
        terragruntRunAvailable ? ["run", "--"] : [],
        ["providers", "lock"],
        lockArgs,
      ),
      {
        cwd: workingDir,
        env: {
          GITHUB_TOKEN: githubToken,
        },
      },
    );
    core.endGroup();

    // Check if lock file changed
    if (
      !existedBefore ||
      (await git.hasFileChanged(".terraform.lock.hcl", workingDir))
    ) {
      // Commit the change
      const lockFileFromGitRootDir = path.relative(
        config.git_root_dir,
        path.join(config.workspace, lockFile),
      );
      await commit.create({
        commitMessage: "chore: update .terraform.lock.hcl",
        githubToken,
        rootDir: config.git_root_dir,
        files: new Set([lockFileFromGitRootDir]),
        serverRepository: input.securefixActionServerRepository,
        appId: input.securefixActionAppId,
        appPrivateKey: input.securefixActionAppPrivateKey,
      });
    }
  }

  core.startGroup(
    terragruntRunAvailable
      ? `${tfCommand} run -- providers`
      : `${tfCommand} providers`,
  );
  await executor.exec(
    tfCommand,
    terragruntRunAvailable ? ["run", "--", "providers"] : ["providers"],
    {
      cwd: workingDir,
    },
  );
  core.endGroup();
};
