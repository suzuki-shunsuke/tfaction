import * as exec from "@actions/exec";
import * as core from "@actions/core";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as lib from "../lib";

type WorkflowRun = {
  headSha: string;
  databaseId: number;
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

  // Check jq and gh versions
  await exec.exec(
    "github-comment",
    ["exec", "-var", `tfaction_target:${target}`, "--", "jq", "--version"],
    {
      env: {
        ...process.env,
        GITHUB_TOKEN: githubToken,
      },
    },
  );

  await exec.exec(
    "github-comment",
    ["exec", "-var", `tfaction_target:${target}`, "--", "gh", "version"],
    {
      env: {
        ...process.env,
        GITHUB_TOKEN: githubToken,
      },
    },
  );

  // Get PR head SHA
  const prJsonPath = path.join(ciInfoTempDir, "pr.json");
  const prJson = JSON.parse(fs.readFileSync(prJsonPath, "utf8"));
  const prHeadSha = prJson.head.sha;

  // Get workflow run
  const result = await exec.getExecOutput(
    "github-comment",
    [
      "exec",
      "-var",
      `tfaction_target:${target}`,
      "-var",
      `plan_workflow_name:${planWorkflowName}`,
      "-k",
      "list-workflow-runs",
      "--",
      "gh",
      "run",
      "list",
      "-w",
      planWorkflowName,
      "-b",
      branch,
      "-L",
      "1",
      "--json",
      "headSha,databaseId",
      "--jq",
      ".[0]",
    ],
    {
      env: {
        ...process.env,
        GITHUB_TOKEN: githubToken,
      },
    },
  );

  if (!result.stdout.trim()) {
    core.error("body is empty. No workflow run is found");
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

  const workflowRun: WorkflowRun = JSON.parse(result.stdout);
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

  await exec.exec(
    "github-comment",
    [
      "exec",
      "-var",
      `tfaction_target:${target}`,
      "-k",
      "download-plan-file",
      "--",
      "gh",
      "run",
      "download",
      "-D",
      tempDir,
      "-n",
      artifactName,
      runId.toString(),
    ],
    {
      env: {
        ...process.env,
        GITHUB_TOKEN: githubToken,
      },
    },
  );

  // Copy file to working directory
  const sourcePath = path.join(tempDir, filename);
  const destPath = path.join(workingDirectory, filename);
  fs.copyFileSync(sourcePath, destPath);
};
