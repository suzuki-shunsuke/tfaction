import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as lib from "../../lib";
import * as drift from "../../lib/drift";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import * as aqua from "../../aqua";
import * as getTargetConfig from "../get-target-config";
import {
  listRelatedPullRequests,
  updateBranchBySecurefix,
  updateBranchByCommit,
} from "./terraform";

export const main = async (): Promise<void> => {
  const githubToken = input.githubToken;
  const driftIssueNumber = env.all.TFACTION_DRIFT_ISSUE_NUMBER;
  const cfg = await lib.getConfig();
  const targetConfig = await getTargetConfig.getTargetConfig(
    {
      target: env.all.TFACTION_TARGET,
      workingDir: env.all.TFACTION_WORKING_DIR,
      isApply: true,
      jobType: lib.getJobType(),
    },
    cfg,
  );
  const workingDir = path.join(
    cfg.git_root_dir,
    targetConfig.working_directory,
  );
  const driftIssueRepo = drift.getDriftIssueRepo(cfg);
  const driftIssueRepoOwner = driftIssueRepo.owner;
  const driftIssueRepoName = driftIssueRepo.name;
  const ciInfoPrNumber = env.all.CI_INFO_PR_NUMBER;
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
      .exec("tfmigrate", ["apply"], {
        cwd: workingDir,
        ignoreReturnCode: true,
        env: env.all.TFMIGRATE_EXEC_PATH
          ? { TFMIGRATE_EXEC_PATH: env.all.TFMIGRATE_EXEC_PATH }
          : undefined,
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
        comment: {
          token: githubToken,
          key: "tfmigrate-apply",
          vars: {
            tfaction_target: targetConfig.target,
          },
        },
      })
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
        "bash",
        ["-c", `cat ${applyOutput} && exit ${exitCode}`],
        {
          cwd: workingDir,
          ignoreReturnCode: true,
          comment: {
            token: githubToken,
            key: "drift-apply",
            org: driftIssueRepoOwner,
            repo: driftIssueRepoName,
            pr: driftIssueNumber,
            vars: {
              pr_url: prUrl,
              tfaction_target: targetConfig.target,
            },
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
    core.info("Skip updating related pull requests");
  } else {
    const prNumbers = await listRelatedPullRequests(
      githubToken,
      targetConfig.target,
    );
    if (securefixServerRepository) {
      await updateBranchBySecurefix(
        github.context.repo.owner,
        securefixServerRepository,
        prNumbers,
      );
    } else {
      await updateBranchByCommit(githubToken, prNumbers);
    }
  }

  if (exitCode !== 0) {
    throw new Error("tfmigrate apply failed");
  }
};
