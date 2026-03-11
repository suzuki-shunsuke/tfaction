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

type Octokit = ReturnType<typeof github.getOctokit>;

const LABEL_PREFIX = "tfaction:plan-result:";

const LABEL_COLORS: Record<ResultSummary, string> = {
  "no-op": "0e8a16",
  create: "1d76db",
  update: "ffff00",
  delete: "d93f0b",
};

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

export const updatePlanResultLabel = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  result: ResultSummary | undefined,
): Promise<void> => {
  const desiredLabel =
    result !== undefined ? `${LABEL_PREFIX}${result}` : undefined;

  // Fetch current labels on the PR (1 API call)
  const { data: currentLabels } = await octokit.rest.issues.listLabelsOnIssue({
    owner,
    repo,
    issue_number: prNumber,
  });

  const existingPlanLabels = currentLabels
    .map((l) => l.name)
    .filter((name) => name.startsWith(LABEL_PREFIX));

  // Remove stale plan-result labels
  for (const label of existingPlanLabels) {
    if (label === desiredLabel) {
      // Label already on PR; ensure its color is correct
      if (result !== undefined) {
        const existing = currentLabels.find((l) => l.name === desiredLabel);
        if (existing && existing.color !== LABEL_COLORS[result]) {
          await octokit.rest.issues.updateLabel({
            owner,
            repo,
            name: desiredLabel,
            color: LABEL_COLORS[result],
          });
          core.info(
            `Updated label "${desiredLabel}" color to #${LABEL_COLORS[result]}`,
          );
        }
      }
      continue;
    }
    await octokit.rest.issues.removeLabel({
      owner,
      repo,
      issue_number: prNumber,
      name: label,
    });
  }

  // Add the desired label if it doesn't already exist
  if (
    desiredLabel !== undefined &&
    !existingPlanLabels.includes(desiredLabel)
  ) {
    const { data: addedLabels } = await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: prNumber,
      labels: [desiredLabel],
    });
    core.info(`Added label "${desiredLabel}" to PR #${prNumber}`);
    if (result !== undefined) {
      const added = addedLabels.find(
        (l: { name: string }) => l.name === desiredLabel,
      );
      if (added && added.color !== LABEL_COLORS[result]) {
        await octokit.rest.issues.updateLabel({
          owner,
          repo,
          name: desiredLabel,
          color: LABEL_COLORS[result],
        });
        core.info(
          `Updated label "${desiredLabel}" color to #${LABEL_COLORS[result]}`,
        );
      }
    }
  }
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

  const octokit = github.getOctokit(inputs.githubToken);

  if (planArtifacts.length === 0) {
    core.info("No terraform plan JSON artifacts found");
    core.setOutput("result_summary", "no-op");
    await updatePlanResultLabel(octokit, owner, repo, inputs.prNumber, "no-op");
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
  await updatePlanResultLabel(octokit, owner, repo, inputs.prNumber, result);
};
