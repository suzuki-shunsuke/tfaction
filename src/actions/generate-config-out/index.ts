import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";

import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import * as aqua from "../../aqua";
import * as getTargetConfig from "../get-target-config";
import * as commit from "../../commit";
import * as run from "./run";

export const main = async () => {
  const githubToken = input.githubToken;
  const branch = input.branch;
  const file = input.file;
  const securefixAppId = input.securefixActionAppId;
  const securefixAppPrivateKey = input.securefixActionAppPrivateKey;

  if (!branch) {
    throw new Error("branch input is required");
  }
  if (!file) {
    throw new Error("file input is required");
  }

  // Get global config
  const config = await lib.getConfig();

  const securefixServerRepository = config?.securefix_action?.server_repository;

  // Get target config
  const targetConfig = await getTargetConfig.getTargetConfig(
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

  if (!workingDir) {
    throw new Error("working_directory is required");
  }

  // Run aqua i -l -a (install)
  const executor = await aqua.NewExecutor({
    cwd: config.git_root_dir,
    githubToken,
  });

  // Generate temp file name
  const runId = env.all.GITHUB_RUN_ID;
  const timestamp = run.formatTimestamp(new Date());
  const tempFile = run.generateTempFileName(runId, timestamp);
  const tempFilePath = path.join(workingDir, tempFile);
  const targetFilePath = path.join(workingDir, file);

  await executor.exec(
    "tfcmt",
    [
      "-output",
      env.all.GITHUB_STEP_SUMMARY,
      "-var",
      `target:${targetConfig.target}`,
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
  const filteredContent = run.filterGeneratedContent(generatedContent);

  // Append to target file or create new file
  const writeMode = run.getWriteMode(fs.existsSync(targetFilePath));
  const contentToWrite = run.prepareContentForWrite(filteredContent, writeMode);
  if (writeMode === "append") {
    fs.appendFileSync(targetFilePath, contentToWrite);
  } else {
    fs.writeFileSync(targetFilePath, contentToWrite);
  }

  // Remove temp file
  fs.unlinkSync(tempFilePath);

  core.info(`Updated ${targetFilePath}`);

  // Commit the changes
  const commitMessage = "chore: import resources";

  await commit.create({
    commitMessage,
    githubToken,
    rootDir: config.git_root_dir,
    files: new Set([
      path.relative(
        config.git_root_dir,
        path.join(config.workspace, targetFilePath),
      ),
    ]),
    serverRepository: securefixServerRepository ?? "",
    appId: securefixAppId,
    appPrivateKey: securefixAppPrivateKey,
    branch,
  });
};
