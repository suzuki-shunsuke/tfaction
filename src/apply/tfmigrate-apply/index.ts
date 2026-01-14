import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as aqua from "../../aqua";
import * as getTargetConfig from "../../get-target-config";
import {
  listRelatedPullRequests,
  updateBranchBySecurefix,
  updateBranchByCommit,
} from "../terraform-apply/run";

export const main = async (): Promise<void> => {
  const githubToken = core.getInput("github_token");
  const driftIssueNumber = env.tfactionDriftIssueNumber;
  const cfg = lib.getConfig();
  const targetConfig = await getTargetConfig.getTargetConfig(
    {
      target: lib.getTargetFromEnv(),
      workingDir: lib.getWorkingDirFromEnv(),
      isApply: true,
      jobType: lib.getJobType(),
    },
    cfg,
  );
  const workingDir = path.join(
    path.dirname(cfg.config_path),
    targetConfig.working_directory,
  );
  const driftIssueRepo = lib.getDriftIssueRepo(cfg);
  const driftIssueRepoOwner = driftIssueRepo.owner;
  const driftIssueRepoName = driftIssueRepo.name;
  const ciInfoPrNumber = env.ciInfoPrNumber;
  const disableUpdateRelatedPullRequests = !(
    cfg.update_related_pull_requests?.enabled ?? true
  );
  const securefixServerRepository =
    cfg.securefix_action?.server_repository ?? "";

  // Create a temporary file for apply output
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tfaction-"));
  const applyOutput = path.join(tempDir, "apply_output.txt");
  const outputStream = fs.createWriteStream(applyOutput);

  const executor = await aqua.NewExecutor({
    githubToken: githubToken,
    cwd: workingDir,
  });

  core.startGroup("tfmigrate apply");
  // Run tfmigrate apply with github-comment
  let exitCode = 0;
  try {
    await executor
      .exec(
        "github-comment",
        [
          "exec",
          "-var",
          `tfaction_target:${targetConfig.target}`,
          "-k",
          "tfmigrate-apply",
          "--",
          "tfmigrate",
          "apply",
        ],
        {
          cwd: workingDir,
          ignoreReturnCode: true,
          env: {
            GH_COMMENT_CONFIG: lib.GitHubCommentConfig,
            GITHUB_TOKEN: githubToken,
            ...(env.tfmigrateExecPath && {
              TFMIGRATE_EXEC_PATH: env.tfmigrateExecPath,
            }),
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
    try {
      await executor.exec(
        "github-comment",
        [
          "exec",
          "-org",
          driftIssueRepoOwner,
          "-repo",
          driftIssueRepoName,
          "-pr",
          driftIssueNumber,
          "-var",
          `pr_url:${prUrl}`,
          "-var",
          `tfaction_target:${targetConfig.target}`,
          "-k",
          "drift-apply",
          "--",
          "bash",
          "-c",
          `cat ${applyOutput} && exit ${exitCode}`,
        ],
        {
          cwd: workingDir,
          ignoreReturnCode: true,
          env: {
            GH_COMMENT_CONFIG: lib.GitHubCommentConfig,
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
  } catch {
    // Ignore the failure
  }

  if (disableUpdateRelatedPullRequests) {
    core.notice("Skip updating related pull requests");
  } else {
    const prNumbers = await listRelatedPullRequests(
      githubToken,
      targetConfig.target,
    );
    if (securefixServerRepository) {
      await updateBranchBySecurefix(securefixServerRepository, prNumbers);
    } else {
      await updateBranchByCommit(githubToken, prNumbers);
    }
  }

  if (exitCode !== 0) {
    throw new Error("tfmigrate apply failed");
  }
};
