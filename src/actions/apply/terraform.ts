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

  // Create a temporary file for apply output
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tfaction-"));
  const applyOutput = path.join(tempDir, "apply_output.txt");
  const outputStream = fs.createWriteStream(applyOutput);

  // Run terraform apply with tfcmt
  let exitCode = 0;
  try {
    await executor
      .exec(
        "tfcmt",
        [
          "-var",
          `target:${targetConfig.target}`,
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
          cwd: workingDir,
          ignoreReturnCode: true,
          secretEnvs: secrets,
          group: `${tfCommand} apply`,
          env: {
            GITHUB_TOKEN: githubTokenForGitHubProvider || githubToken,
            TFCMT_GITHUB_TOKEN: githubToken,
            TERRAGRUNT_LOG_DISABLE: "true", // https://suzuki-shunsuke.github.io/tfcmt/terragrunt
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
      commentOverrides: cfg.comments,
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
      commentOverrides: cfg.comments,
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
