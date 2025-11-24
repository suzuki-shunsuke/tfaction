import * as exec from "@actions/exec";
import * as core from "@actions/core";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export const main = async (): Promise<void> => {
  const tfCommand = process.env.TF_COMMAND || "terraform";
  const target = process.env.TFACTION_TARGET || "";
  const driftIssueNumber = process.env.TFACTION_DRIFT_ISSUE_NUMBER || "";
  const driftIssueRepoOwner =
    process.env.TFACTION_DRIFT_ISSUE_REPO_OWNER || "";
  const driftIssueRepoName = process.env.TFACTION_DRIFT_ISSUE_REPO_NAME || "";
  const githubServerUrl = process.env.GITHUB_SERVER_URL || "";
  const githubRepository = process.env.GITHUB_REPOSITORY || "";
  const ciInfoPrNumber = process.env.CI_INFO_PR_NUMBER || "";
  const disableUpdateRelatedPullRequests =
    process.env.DISABLE_UPDATE_RELATED_PULL_REQUESTS === "true";
  const installDir = process.env.TFACTION_INSTALL_DIR || "";
  const planFilePath = process.env.PLAN_FILE_PATH || "";
  if (!planFilePath) {
    throw new Error("PLAN_FILE_PATH is not set");
  }

  // Create a temporary file for apply output
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tfaction-"));
  const applyOutput = path.join(tempDir, "apply_output.txt");
  const outputStream = fs.createWriteStream(applyOutput);

  core.startGroup(`${tfCommand} apply`);

  // Run terraform apply with tfcmt
  let exitCode = 0;
  try {
    await exec.exec(
      "tfcmt",
      [
        "-var",
        `target:${target}`,
        "apply",
        "--",
        tfCommand,
        "apply",
        "-auto-approve",
        "-no-color",
        "-input=false",
        planFilePath,
      ],
      {
        ignoreReturnCode: true,
        listeners: {
          stdout: (data: Buffer) => {
            process.stdout.write(data);
            outputStream.write(data);
          },
          stderr: (data: Buffer) => {
            process.stderr.write(data);
            outputStream.write(data);
          },
        },
      },
    ).then((code) => {
      exitCode = code;
    });
  } finally {
    outputStream.end();
  }

  core.endGroup();

  // If this is a drift issue, post the result to the drift issue
  if (driftIssueNumber) {
    const prUrl = `${githubServerUrl}/${githubRepository}/pull/${ciInfoPrNumber}`;
    const tfcmtConfig = path.join(installDir, "tfcmt-drift.yaml");

    try {
      await exec.exec(
        "tfcmt",
        [
          "-config",
          tfcmtConfig,
          "-owner",
          driftIssueRepoOwner,
          "-repo",
          driftIssueRepoName,
          "-pr",
          driftIssueNumber,
          "-var",
          `pr_url:${prUrl}`,
          "-var",
          `target:${target}`,
          "apply",
          "--",
          "bash",
          "-c",
          `cat ${applyOutput} && exit ${exitCode}`,
        ],
        {
          ignoreReturnCode: true,
        },
      );
    } catch (error) {
      // Ignore the failure
      core.warning(`Failed to post to drift issue: ${error}`);
    }
  }

  // Clean up temporary file
  try {
    fs.rmdirSync(tempDir);
  } catch (error) {
    // Ignore the failure
  }

  if (disableUpdateRelatedPullRequests) {
    core.notice("Skip updating related pull requests");
  }

  if (exitCode !== 0) {
    throw new Error("terraform apply failed");
  }
};
