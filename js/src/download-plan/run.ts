import * as exec from "@actions/exec";
import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as lib from "../lib";
import { DefaultArtifactClient, FindOptions, DownloadArtifactOptions } from "@actions/artifact";

type WorkflowRun = {
  headSha: string;
  databaseId: number;
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

export const main = async (): Promise<void> => {
  const cfg = lib.getConfig();
  const githubToken = core.getInput("github_token");
  const target = process.env.TFACTION_TARGET || "";
  const planWorkflowName = cfg.plan_workflow_name;
  const ciInfoTempDir = process.env.CI_INFO_TEMP_DIR || "";
  const branch = process.env.CI_INFO_HEAD_REF || "";
  const workingDirectory = process.env.TFACTION_WORKING_DIR || process.cwd();

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
    core.error("No workflow run is found");
    await exec.exec(
      "github-comment",
      [
        "post",
        "-var",
        `tfaction_target:${target}`,
        "-var",
        `plan_workflow_name:${planWorkflowName}`,
        "-var",
        `branch:${branch}`,
        "-k",
        "no-workflow-run-found",
      ],
      {
        env: {
          ...process.env,
          GITHUB_TOKEN: githubToken,
        },
      },
    );
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
    core.error(
      `workflow run's headSha (${headSha}) is different from the associated pull request's head sha (${prHeadSha})`,
    );
    await exec.exec(
      "github-comment",
      [
        "post",
        "-var",
        `tfaction_target:${target}`,
        "-var",
        `wf_sha:${headSha}`,
        "-var",
        `pr_sha:${prHeadSha}`,
        "-k",
        "invalid-workflow-sha",
      ],
      {
        env: {
          ...process.env,
          GITHUB_TOKEN: githubToken,
        },
      },
    );
    throw new Error("workflow run's headSha is invalid");
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
  core.setOutput("plan_file_path", sourcePath);
};
