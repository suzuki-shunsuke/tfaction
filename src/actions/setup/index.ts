import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import * as aqua from "../../aqua";
import * as ciinfo from "../../ci-info";
import { getTargetConfig } from "../get-target-config";
import * as aquaUpdateChecksum from "./aqua-update-checksum";
import * as checkTerraformSkip from "../../check-terraform-skip";
import {
  isPullRequestEvent as isPullRequestEventFn,
  shouldSkipCIInfo as shouldSkipCIInfoFn,
  checkLatestCommit as checkLatestCommitFn,
} from "./run";

// Check if this is a pull request event
const isPullRequestEvent = (): boolean => {
  return isPullRequestEventFn(github.context.eventName);
};

// Check if ci-info should be skipped
const shouldSkipCIInfo = (): boolean => {
  return shouldSkipCIInfoFn(github.context.eventName);
};

// Check if the PR head SHA is the latest
const checkLatestCommit = (latestHeadSHA: string): void => {
  checkLatestCommitFn(github.context.payload.pull_request, latestHeadSHA);
};

// Add label to PR
const addLabelToPR = async (
  octokit: ReturnType<typeof github.getOctokit>,
  target: string,
  prNumber: number,
): Promise<void> => {
  if (prNumber <= 0) {
    throw new Error("Failed to get a pull request number");
  }
  try {
    await octokit.rest.issues.addLabels({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: prNumber,
      labels: [target],
    });
    core.info(`Added label "${target}" to PR #${prNumber}`);
  } catch (error) {
    core.warning(`Failed to add label to PR: ${error}`);
  }
};

// Set up SSH key
const setupSSHKey = async (sshKey: string): Promise<void> => {
  if (!sshKey) {
    return;
  }

  const sshDir = path.join(os.homedir(), ".ssh");
  const keyPath = path.join(sshDir, "id_rsa");

  await fs.promises.mkdir(sshDir, { recursive: true });
  await fs.promises.writeFile(keyPath, sshKey);
  await fs.promises.chmod(keyPath, 0o600);

  core.info("SSH key configured for private modules");
};

export const main = async () => {
  core.exportVariable("AQUA_GLOBAL_CONFIG", lib.aquaGlobalConfig);
  const githubToken = input.getRequiredGitHubToken();

  const octokit = github.getOctokit(githubToken);
  const isPR = isPullRequestEvent();

  const config = await lib.getConfig();
  const targetConfig = await getTargetConfig(
    {
      target: env.all.TFACTION_TARGET,
      workingDir: env.all.TFACTION_WORKING_DIR,
      isApply: env.isApply,
      jobType: lib.getJobType(),
    },
    config,
  );
  const workingDir = path.join(
    config.git_root_dir,
    targetConfig.working_directory,
  );

  if (!shouldSkipCIInfo()) {
    const ci = await ciinfo.main();
    if (isPR) {
      core.info("Checking if commit is latest...");

      await checkLatestCommit(ci.pr?.data.head.sha ?? "");
      // Add label to PR (only for PRs)
      await addLabelToPR(
        octokit,
        targetConfig.target,
        github.context.payload.pull_request?.number ?? 0,
      );

      await checkTerraformSkip.main(config, {
        skipLabelPrefix: config.label_prefixes.skip,
        labels: ci.pr?.data.labels?.map((label) => label.name) ?? [],
        prAuthor: ci.pr?.data.user.login ?? "",
        target: targetConfig.target,
      });
    }
  }

  // Set environment variables from target config
  core.exportVariable("TFACTION_WORKING_DIR", targetConfig.working_directory);
  core.exportVariable("TFACTION_TARGET", targetConfig.target);
  if (targetConfig.env) {
    for (const [key, value] of Object.entries(targetConfig.env)) {
      core.exportVariable(key, value);
    }
  }

  // Set outputs from target config
  for (const [key, value] of Object.entries(targetConfig)) {
    if (key !== "env" && key !== "target" && value !== undefined) {
      core.setOutput(key, value);
    }
  }

  const executor = await aqua.NewExecutor({
    githubToken: githubToken,
    cwd: workingDir,
  });

  if (isPR && config.aqua?.update_checksum?.enabled) {
    try {
      core.info("updating checksum");
      await aquaUpdateChecksum.main(executor, workingDir, config, {
        githubToken: githubToken,
        securefixActionAppId: input.securefixActionAppId,
        securefixActionAppPrivateKey: input.securefixActionAppPrivateKey,
      });
    } catch (error) {
      // aqua-update-checksum throws when file is updated, which is expected
      if (error instanceof Error && error.message.includes("is updated")) {
        throw error;
      }
      if (error instanceof Error && error.message.includes("isn't latest")) {
        throw error;
      }
      throw error;
    }
  }

  if (input.sshKey) {
    core.info("Setting up SSH key...");
    await setupSSHKey(input.sshKey);
  }

  core.setOutput("working_directory", targetConfig.working_directory);
  core.setOutput(
    "s3_bucket_name_tfmigrate_history",
    targetConfig.s3_bucket_name_tfmigrate_history ?? "",
  );

  core.info("Setup completed successfully");
};
