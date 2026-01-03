import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as github from "@actions/github";
import * as securefix from "@csm-actions/securefix-action";
import * as commit from "@suzuki-shunsuke/commit-ts";
import * as fs from "fs";
import * as path from "path";

import * as lib from "../lib";
import * as getGlobalConfig from "../get-global-config";
import * as getTargetConfig from "../get-target-config";

type Octokit = ReturnType<typeof github.getOctokit>;

export const main = async () => {
  const githubToken = core.getInput("github_token") || "";
  const branch = core.getInput("branch");
  const file = core.getInput("file");
  const securefixAppId = core.getInput("securefix_action_app_id") || "";
  const securefixAppPrivateKey =
    core.getInput("securefix_action_app_private_key") || "";

  if (!branch) {
    throw new Error("branch input is required");
  }
  if (!file) {
    throw new Error("file input is required");
  }

  // Get global config
  const config = lib.getConfig();

  const securefixServerRepository = config?.securefix_action?.server_repository;

  // Get target config
  const targetConfigResult = await getTargetConfig.run(
    {
      target: process.env.TFACTION_TARGET,
      workingDir: process.env.TFACTION_WORKING_DIR,
      isApply: lib.getIsApply(),
      jobType: lib.getJobType(),
    },
    config,
  );

  const workingDir =
    targetConfigResult.outputs.get("working_directory") ||
    process.env.TFACTION_WORKING_DIR ||
    "";
  const target =
    targetConfigResult.envs.get("TFACTION_TARGET") ||
    process.env.TFACTION_TARGET ||
    "";

  if (!workingDir) {
    throw new Error("working_directory is required");
  }

  // Run aqua i -l -a (install)
  core.info(`Installing dependencies with aqua in ${workingDir}`);
  await exec.exec("aqua", ["i", "-l", "-a"], {
    cwd: workingDir,
  });

  // Generate temp file name
  const runId = process.env.GITHUB_RUN_ID ?? "";
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T]/g, "")
    .replace(/\..+/, "");
  const tempFile = `generated_${runId}_${timestamp}.tf`;
  const tempFilePath = path.join(workingDir, tempFile);
  const targetFilePath = path.join(workingDir, file);

  // Run terraform plan -generate-config-out with tfcmt
  const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY ?? "";
  core.info(`Running terraform plan -generate-config-out ${tempFile}`);

  await exec.exec(
    "tfcmt",
    [
      "-output",
      stepSummaryPath,
      "-var",
      `target:${target}`,
      "plan",
      "--",
      "terraform",
      "plan",
      "-generate-config-out",
      tempFile,
    ],
    {
      cwd: workingDir,
    },
  );

  // Read generated file and filter out comments and empty lines
  if (!fs.existsSync(tempFilePath)) {
    core.warning(`Generated file ${tempFilePath} does not exist`);
    return;
  }

  const generatedContent = fs.readFileSync(tempFilePath, "utf8");
  const filteredLines = generatedContent
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      // Skip comments (lines starting with #) and empty lines
      return trimmed.length > 0 && !trimmed.startsWith("#");
    })
    .join("\n");

  // Append to target file
  if (fs.existsSync(targetFilePath)) {
    fs.appendFileSync(targetFilePath, "\n" + filteredLines);
  } else {
    fs.writeFileSync(targetFilePath, filteredLines);
  }

  // Remove temp file
  fs.unlinkSync(tempFilePath);

  core.info(`Updated ${targetFilePath}`);

  // Commit the changes
  const commitMessage = "chore: import resources";

  if (securefixServerRepository) {
    if (!securefixAppId || !securefixAppPrivateKey) {
      throw new Error(
        "securefix_action_app_id and securefix_action_app_private_key are required when securefix_action_server_repository is set",
      );
    }

    await securefix.request({
      appId: securefixAppId,
      privateKey: securefixAppPrivateKey,
      serverRepository: securefixServerRepository,
      branch,
      files: new Set([targetFilePath]),
      commitMessage,
      workspace: process.env.GITHUB_WORKSPACE ?? "",
    });
    core.info("Created commit via securefix");
  } else {
    if (!githubToken) {
      throw new Error(
        "github_token is required when securefix_action_server_repository is not set",
      );
    }

    const octokit = github.getOctokit(githubToken);

    await commit.createCommit(octokit, {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      branch,
      message: commitMessage,
      files: [targetFilePath],
      deleteIfNotExist: true,
      logger: {
        info: core.info,
      },
    });
    core.info(`Created commit on branch ${branch}`);
  }
};
