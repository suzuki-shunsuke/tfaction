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
  DefaultArtifactClient,
  FindOptions,
  DownloadArtifactOptions,
} from "@actions/artifact";
import { post } from "../../comment";

type WorkflowRun = {
  headSha: string;
  databaseId: number;
};

export const main = async (
  secrets?: Record<string, string>,
  githubTokenForGitHubProvider?: string,
): Promise<void> => {
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
  const tfCommand = targetConfig.terraform_command;
  const driftIssueRepo = drift.getDriftIssueRepo(cfg);
  const driftIssueRepoOwner = driftIssueRepo.owner;
  const driftIssueRepoName = driftIssueRepo.name;
  const ciInfoPrNumber = env.all.CI_INFO_PR_NUMBER;
  const executor = await aqua.NewExecutor({
    githubToken: githubToken,
    cwd: workingDir,
  });
  const planFilePath = await downloadPlanFile();
  if (!planFilePath) {
    throw new Error("PLAN_FILE_PATH is not set");
  }

  // Create a temp directory for the captured apply output. The same file
  // is later replayed into tfcmt (for the PR comment and Job Summary) and
  // into the drift issue notification.
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tfaction-"));
  const applyOutput = path.join(tempDir, "apply_output.txt");

  // Run terraform/terragrunt apply directly, capturing combined
  // stdout/stderr while @actions/exec streams to the Actions log. The
  // captured output is replayed into tfcmt below so apply runs only once.
  let combinedApplyOutput = "";
  const exitCode = await executor.exec(
    tfCommand,
    ["apply", "-auto-approve", "-no-color", "-input=false", planFilePath],
    {
      cwd: workingDir,
      ignoreReturnCode: true,
      secretEnvs: secrets,
      group: `${tfCommand} apply`,
      env: {
        GITHUB_TOKEN: githubTokenForGitHubProvider || githubToken,
        TERRAGRUNT_LOG_DISABLE: "true", // https://suzuki-shunsuke.github.io/tfcmt/terragrunt
      },
      listeners: {
        stdout: (data: Buffer) => {
          combinedApplyOutput += data.toString();
        },
        stderr: (data: Buffer) => {
          combinedApplyOutput += data.toString();
        },
      },
    },
  );
  fs.writeFileSync(applyOutput, combinedApplyOutput);

  // Replay captured output into tfcmt for PR comment and Step Summary.
  // Two tfcmt invocations are required because --output writes to a file
  // instead of the PR; there is no single-call "both" mode.
  const tfcmtGlobalArgs = ["-var", `target:${targetConfig.target}`];
  // Positional args ($1, $2) keep the temp path / exit code out of the
  // shell script body.
  const tfcmtReplayArgs = [
    "apply",
    "--",
    "bash",
    "-c",
    'cat "$1" && exit "$2"',
    "_",
    applyOutput,
    String(exitCode),
  ];
  const tfcmtEnv = {
    GITHUB_TOKEN: githubTokenForGitHubProvider || githubToken,
    TFCMT_GITHUB_TOKEN: githubToken,
    TERRAGRUNT_LOG_DISABLE: "true",
  };

  try {
    await executor.exec("tfcmt", [...tfcmtGlobalArgs, ...tfcmtReplayArgs], {
      cwd: workingDir,
      ignoreReturnCode: true,
      group: "tfcmt apply",
      env: tfcmtEnv,
    });
  } catch (e) {
    core.warning(
      `Failed to post tfcmt PR comment: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  const stepSummaryPath = env.all.GITHUB_STEP_SUMMARY;
  if (stepSummaryPath) {
    try {
      await executor.exec(
        "tfcmt",
        ["--output", stepSummaryPath, ...tfcmtGlobalArgs, ...tfcmtReplayArgs],
        {
          cwd: workingDir,
          ignoreReturnCode: true,
          group: "tfcmt apply (step summary)",
          env: tfcmtEnv,
        },
      );
    } catch (e) {
      core.warning(
        `Failed to write tfcmt Step Summary: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  // If this is a drift issue, post the result to the drift issue
  if (driftIssueNumber) {
    const prUrl = `${github.context.serverUrl}/${github.context.repo.owner}/${github.context.repo.repo}/pull/${ciInfoPrNumber}`;
    const tfcmtConfig = path.join(
      lib.GitHubActionPath,
      "install",
      "tfcmt-drift.yaml",
    );

    try {
      await executor.exec(
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
          `target:${targetConfig.target}`,
          "apply",
          "--",
          "bash",
          "-c",
          `cat ${applyOutput} && exit ${exitCode}`,
        ],
        {
          cwd: workingDir,
          ignoreReturnCode: true,
          env: {
            GITHUB_TOKEN: githubTokenForGitHubProvider || githubToken,
            TFCMT_GITHUB_TOKEN: githubToken,
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

  if (exitCode !== 0) {
    throw new Error("terraform apply failed");
  }
};

const downloadArtifact = async (
  token: string,
  owner: string,
  repo: string,
  runId: number,
  artifactName: string,
  dest: string,
): Promise<void> => {
  // Download a GitHub Actions Artifact
  const artifact = new DefaultArtifactClient();
  core.info(`Getting an artifact`);
  const artifactOpts: DownloadArtifactOptions & FindOptions = {
    findBy: {
      token: token,
      repositoryOwner: owner,
      repositoryName: repo,
      workflowRunId: runId,
    },
    path: dest,
  };
  const { artifact: targetArtifact } = await artifact.getArtifact(
    artifactName,
    artifactOpts,
  );
  if (!targetArtifact) {
    core.setFailed(`Artifact '${artifactName}' not found`);
    return;
  }
  core.info(`Downloading an artifact`);
  await artifact.downloadArtifact(targetArtifact.id, artifactOpts);
};

const downloadPlanFile = async (): Promise<string> => {
  const cfg = await lib.getConfig();
  const githubToken = input.githubToken;
  const target = env.all.TFACTION_TARGET;
  const planWorkflowName = cfg.plan_workflow_name;
  const ciInfoTempDir = env.all.CI_INFO_TEMP_DIR;
  const branch = env.all.CI_INFO_HEAD_REF;

  const filename = "tfplan.binary";
  const artifactName = `terraform_plan_file_${target.replaceAll("/", "__")}`;

  // Get PR head SHA
  const prJsonPath = path.join(ciInfoTempDir, "pr.json");
  const prJson = JSON.parse(fs.readFileSync(prJsonPath, "utf8"));
  const prHeadSha = prJson.head.sha;

  // Get workflow run
  const octokit = github.getOctokit(githubToken);
  const { data: workflowRuns } = await octokit.rest.actions.listWorkflowRuns({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    workflow_id: planWorkflowName,
    branch: branch,
    per_page: 1,
  });

  if (workflowRuns.workflow_runs.length === 0) {
    const ciInfoPrNumber = env.all.CI_INFO_PR_NUMBER;
    await post({
      octokit,
      prNumber: parseInt(ciInfoPrNumber, 10),
      templateKey: "no-workflow-run-found",
      vars: {
        tfaction_target: target,
        plan_workflow_name: planWorkflowName,
        branch: branch,
      },
    });
    throw new Error("No workflow run is found");
  }

  const latestRun = workflowRuns.workflow_runs[0];
  const workflowRun: WorkflowRun = {
    headSha: latestRun.head_sha,
    databaseId: latestRun.id,
  };
  const runId = workflowRun.databaseId;
  const headSha = workflowRun.headSha;

  // Check if headSha matches
  if (headSha !== prHeadSha) {
    const ciInfoPrNumber = env.all.CI_INFO_PR_NUMBER;
    await post({
      octokit,
      prNumber: parseInt(ciInfoPrNumber, 10),
      templateKey: "invalid-workflow-sha",
      vars: {
        tfaction_target: target,
        wf_sha: headSha,
        pr_sha: prHeadSha,
      },
    });
    throw new Error(
      `workflow run's headSha (${headSha}) is different from the associated pull request's head sha (${prHeadSha})`,
    );
  }

  // Download artifact
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tfaction-"));

  await downloadArtifact(
    githubToken,
    github.context.repo.owner,
    github.context.repo.repo,
    runId,
    artifactName,
    tempDir,
  );

  const sourcePath = path.join(tempDir, filename);
  return sourcePath;
};
