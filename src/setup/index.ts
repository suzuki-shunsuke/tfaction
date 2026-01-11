import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import * as lib from "../lib";
import * as aqua from "../aqua";
import * as ciinfo from "../ci-info";
import { getTargetConfig } from "../get-target-config";
import * as aquaUpdateChecksum from "./aqua-update-checksum";
import * as exportAWSSecretsManager from "../export-aws-secrets-manager";

// Check if this is a pull request event
const isPullRequestEvent = (): boolean => {
  const eventName = github.context.eventName;
  return eventName === "pull_request" || eventName.startsWith("pull_request_");
};

// Check if ci-info should be skipped
const shouldSkipCIInfo = (): boolean => {
  const eventName = github.context.eventName;
  return eventName === "workflow_dispatch" || eventName === "schedule";
};

// Check if the PR head SHA is the latest
const checkLatestCommit = async (): Promise<void> => {
  const headSha = github.context.payload.pull_request?.head?.sha;
  if (!headSha) {
    return;
  }

  const tempDir = process.env.CI_INFO_TEMP_DIR;
  if (!tempDir) {
    core.warning("CI_INFO_TEMP_DIR not set, skipping latest commit check");
    return;
  }

  const prJsonPath = path.join(tempDir, "pr.json");
  if (!fs.existsSync(prJsonPath)) {
    core.warning("pr.json not found, skipping latest commit check");
    return;
  }

  const prData = JSON.parse(fs.readFileSync(prJsonPath, "utf8"));
  const latestHeadSha = prData.head?.sha;

  if (headSha !== latestHeadSha) {
    throw new Error(
      `The head sha (${headSha}) isn't latest (${latestHeadSha}).`,
    );
  }
};

// Add label to PR
const addLabelToPR = async (
  octokit: ReturnType<typeof github.getOctokit>,
  target: string,
): Promise<void> => {
  const prNumber = process.env.CI_INFO_PR_NUMBER;
  if (!prNumber) {
    core.warning("CI_INFO_PR_NUMBER not set, skipping label");
    return;
  }

  try {
    await octokit.rest.issues.addLabels({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: parseInt(prNumber, 10),
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
  core.exportVariable(
    "TFACTION_GITHUB_COMMENT_CONFIG",
    lib.GitHubCommentConfig,
  );
  const githubToken = core.getInput("github_token", { required: true });
  const sshKey = core.getInput("ssh_key");

  const octokit = github.getOctokit(githubToken);

  if (!shouldSkipCIInfo()) {
    await ciinfo.main();
  }

  if (isPullRequestEvent()) {
    core.info("Checking if commit is latest...");
    await checkLatestCommit();
  }

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

  // 5. Add label to PR (only for PRs)
  if (isPullRequestEvent()) {
    await addLabelToPR(octokit, targetConfig.target);
  }

  const executor = await aqua.NewExecutor({
    githubToken: githubToken,
    cwd: targetConfig.working_directory,
  });

  if (config.aqua?.update_checksum?.enabled) {
    try {
      core.info("updating checksum");
      await aquaUpdateChecksum.main(executor);
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

  await exportAWSSecretsManager.main();

  if (sshKey) {
    core.info("Setting up SSH key...");
    await setupSSHKey(sshKey);
  }

  core.setOutput("working_directory", targetConfig.working_directory);
  core.setOutput(
    "s3_bucket_name_tfmigrate_history",
    targetConfig.s3_bucket_name_tfmigrate_history ?? "",
  );

  core.info("Setup completed successfully");
};
