import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as github from "@actions/github";
import * as fs from "fs";
import * as path from "path";

import { getTargetConfig } from "../get-target-config";
import * as lib from "../lib";
import * as aqua from "../aqua";
import * as commit from "../commit";

// Check if this is a pull request event
const isPullRequestEvent = (): boolean => {
  const eventName = github.context.eventName;
  return eventName === "pull_request" || eventName.startsWith("pull_request_");
};

// Check if a file has changed using git diff
const hasFileChanged = async (file: string): Promise<boolean> => {
  const result = await exec.getExecOutput("git", ["diff", "--quiet", file], {
    ignoreReturnCode: true,
  });
  return result.exitCode !== 0;
};

export const main = async () => {
  const githubToken = core.getInput("github_token", { required: true });
  const config = lib.getConfig();

  const targetConfig = await getTargetConfig(
    {
      target: process.env.TFACTION_TARGET,
      workingDir: process.env.TFACTION_WORKING_DIR,
      isApply: lib.getIsApply(),
      jobType: lib.getJobType(),
    },
    config,
  );

  const workingDir = targetConfig.working_directory;
  const tfCommand = targetConfig.terraform_command;
  const providersLockOpts = targetConfig.providers_lock_opts;

  const executor = await aqua.NewExecutor({
    githubToken,
    cwd: workingDir,
  });

  if (!isPullRequestEvent()) {
    // Non-PR: just run init with github-comment
    await executor.exec(
      "github-comment",
      ["exec", "--", tfCommand, "init", "-input=false"],
      {
        cwd: workingDir || undefined,
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
        cwd: workingDir || undefined,
        ignoreReturnCode: true,
      },
    );
    if (initResult !== 0) {
      await executor.exec(
        "github-comment",
        ["exec", "--", tfCommand, "init", "-input=false", "-upgrade"],
        {
          cwd: workingDir || undefined,
          env: {
            GITHUB_TOKEN: githubToken,
          },
        },
      );
    }
    core.endGroup();

    core.startGroup(`${tfCommand} providers lock`);
    const lockArgs = providersLockOpts.split(/\s+/).filter((s) => s.length > 0);
    await executor.exec(
      "github-comment",
      ["exec", "--", tfCommand, "providers", "lock", ...lockArgs],
      {
        cwd: workingDir || undefined,
        env: {
          GITHUB_TOKEN: githubToken,
        },
      },
    );
    core.endGroup();

    // Check if lock file changed
    if (!existedBefore || (await hasFileChanged(lockFile))) {
      // Commit the change
      await commit.create({
        commitMessage: "chore: update .terraform.lock.hcl",
        githubToken,
        files: new Set([lockFile]),
        serverRepository: core.getInput("securefix_action_server_repository"),
        appId: core.getInput("securefix_action_app_id"),
        appPrivateKey: core.getInput("securefix_action_app_private_key"),
      });
    }
  }

  core.startGroup(`${tfCommand} providers`);
  await executor.exec(tfCommand, ["providers"], {
    cwd: workingDir || undefined,
  });
  core.endGroup();
};
