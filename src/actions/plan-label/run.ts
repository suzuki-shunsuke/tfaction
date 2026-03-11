import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as github from "@actions/github";
import {
  DefaultArtifactClient,
  type FindOptions,
  type DownloadArtifactOptions,
} from "@actions/artifact";
import { getResultSummary, type ResultSummary } from "../plan/run";

export type RunInputs = {
  githubToken: string;
  prNumber: number;
  workflowRunId: number;
};

const LABEL_PREFIX = "tfaction:plan-result:";
const ALL_LABELS = [
  `${LABEL_PREFIX}no-op`,
  `${LABEL_PREFIX}create`,
  `${LABEL_PREFIX}update`,
  `${LABEL_PREFIX}delete`,
];

const PRIORITY: Record<ResultSummary, number> = {
  "no-op": 0,
  create: 1,
  update: 2,
  delete: 3,
};

export const aggregateResultSummaries = (
  summaries: ResultSummary[],
): ResultSummary => {
  let result: ResultSummary = "no-op";
  for (const s of summaries) {
    if (PRIORITY[s] > PRIORITY[result]) {
      result = s;
    }
  }
  return result;
};

export const main = async (inputs: RunInputs): Promise<void> => {
  const { owner, repo } = github.context.repo;
  const artifact = new DefaultArtifactClient();

  // List all artifacts in the current workflow run
  const findBy: FindOptions["findBy"] = {
    token: inputs.githubToken,
    repositoryOwner: owner,
    repositoryName: repo,
    workflowRunId: inputs.workflowRunId,
  };

  const { artifacts } = await artifact.listArtifacts({
    latest: true,
    findBy,
  });

  // Filter plan JSON artifacts
  const planArtifacts = artifacts.filter((a) =>
    a.name.startsWith("terraform_plan_json_"),
  );

  if (planArtifacts.length === 0) {
    core.info("No terraform plan JSON artifacts found");
    core.setOutput("result_summary", "no-op");
    return;
  }

  // Download each artifact and get result summary
  const summaries: ResultSummary[] = [];
  for (const art of planArtifacts) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tfaction-plan-"));
    const opts: DownloadArtifactOptions & FindOptions = {
      findBy,
      path: tempDir,
    };
    await artifact.downloadArtifact(art.id, opts);

    // Read the plan JSON file
    const planJsonPath = path.join(tempDir, "tfplan.json");
    if (!fs.existsSync(planJsonPath)) {
      core.warning(
        `Plan JSON file not found in artifact ${art.name}, skipping`,
      );
      continue;
    }
    const content = fs.readFileSync(planJsonPath, "utf8");
    summaries.push(getResultSummary(content));
  }

  const result = aggregateResultSummaries(summaries);
  core.setOutput("result_summary", result);
  core.info(`Aggregated plan result: ${result}`);

  // Manage labels on the PR
  const octokit = github.getOctokit(inputs.githubToken);
  const labelToAdd = `${LABEL_PREFIX}${result}`;

  // Remove existing plan-result labels
  for (const label of ALL_LABELS) {
    if (label === labelToAdd) {
      continue;
    }
    try {
      await octokit.rest.issues.removeLabel({
        owner,
        repo,
        issue_number: inputs.prNumber,
        name: label,
      });
    } catch {
      // Label may not exist, ignore
    }
  }

  // Add the new label
  await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number: inputs.prNumber,
    labels: [labelToAdd],
  });
  core.info(`Added label "${labelToAdd}" to PR #${inputs.prNumber}`);
};
