import * as exec from "@actions/exec";
import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as lib from "../lib";
import * as getGlobalConfig from "../get-global-config";
import * as getTargetConfig from "../get-target-config";
import {
  listRelatedPullRequests,
  updateBranchBySecurefix,
  updateBranchByCommit,
} from "../terraform-apply/run";

export const main = async (): Promise<void> => {
  const githubToken = core.getInput("github_token");
  const driftIssueNumber = process.env.TFACTION_DRIFT_ISSUE_NUMBER || "";
  const cfg = lib.getConfig();
  const globalConfig = await getGlobalConfig.main_(cfg, {
    drift_issue_number: driftIssueNumber,
  });
  const target = lib.getTarget();
  if (!target) {
    throw new Error("TFACTION_TARGET is not set");
  }
  const targetConfig = await getTargetConfig.getTargetConfig(
    {
      target: target,
      workingDir: lib.getWorkingDir(),
      isApply: true,
      jobType: lib.getJobType(),
    },
    cfg,
  );
  const tfCommand = targetConfig.terraform_command || "terraform";
  const driftIssueRepoOwner = globalConfig.outputs.drift_issue_repo_owner;
  const driftIssueRepoName = globalConfig.outputs.drift_issue_repo_name;
  const ciInfoPrNumber = process.env.CI_INFO_PR_NUMBER || "";
  const disableUpdateRelatedPullRequests =
    globalConfig.outputs.disable_update_related_pull_requests;
  const installDir = process.env.TFACTION_INSTALL_DIR || "";

  // Set TFMIGRATE_EXEC_PATH if needed
  const tfmigrateExecPath = process.env.TFMIGRATE_EXEC_PATH || "";
  if (!tfmigrateExecPath && tfCommand !== "terraform") {
    process.env.TFMIGRATE_EXEC_PATH = tfCommand;
  }

  // Create a temporary file for apply output
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tfaction-"));
  const applyOutput = path.join(tempDir, "apply_output.txt");
  const outputStream = fs.createWriteStream(applyOutput);

  core.startGroup("tfmigrate apply");

  // Run tfmigrate apply with github-comment
  let exitCode = 0;
  try {
    await exec
      .exec(
        "github-comment",
        [
          "exec",
          "--config",
          path.join(installDir, "tfmigrate-apply/github-comment.yaml"),
          "-var",
          `tfaction_target:${target}`,
          "-k",
          "tfmigrate-apply",
          "--",
          "tfmigrate",
          "apply",
        ],
        {
          ignoreReturnCode: true,
          env: {
            ...process.env,
            GITHUB_TOKEN: githubToken,
          },
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
      )
      .then((code) => {
        exitCode = code;
      });
  } finally {
    outputStream.end();
  }

  core.endGroup();

  // If this is a drift issue, post the result to the drift issue
  if (driftIssueNumber) {
    const prUrl = `${github.context.serverUrl}/${github.context.repo.owner}/${github.context.repo.repo}/pull/${ciInfoPrNumber}`;
    const githubCommentConfig = path.join(
      installDir,
      "tfmigrate-apply/github-comment.yaml",
    );

    try {
      await exec.exec(
        "github-comment",
        [
          "exec",
          "--config",
          githubCommentConfig,
          "-org",
          driftIssueRepoOwner,
          "-repo",
          driftIssueRepoName,
          "-pr",
          driftIssueNumber,
          "-var",
          `pr_url:${prUrl}`,
          "-var",
          `tfaction_target:${target}`,
          "-k",
          "drift-apply",
          "--",
          "bash",
          "-c",
          `cat ${applyOutput} && exit ${exitCode}`,
        ],
        {
          ignoreReturnCode: true,
          env: {
            ...process.env,
            GITHUB_TOKEN: githubToken,
          },
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
  } else {
    const prNumbers = await listRelatedPullRequests(githubToken, target);
    if (globalConfig.outputs.securefix_action_server_repository) {
      await updateBranchBySecurefix(globalConfig, prNumbers);
    } else {
      await updateBranchByCommit(githubToken, prNumbers);
    }
  }

  if (exitCode !== 0) {
    throw new Error("tfmigrate apply failed");
  }
};
