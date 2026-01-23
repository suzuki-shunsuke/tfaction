import * as core from "@actions/core";
import * as github from "@actions/github";
import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";

type Inputs = {
  ghToken: string;
  status: string;
  issueNumber: number | undefined;
  issueState: string | undefined;
  repoOwner: string;
  repoName: string;
  skipTerraform: boolean;
};

export const main = async () => {
  const issueNumberStr = env.tfactionDriftIssueNumber;
  if (!issueNumberStr) {
    core.info("TFACTION_DRIFT_ISSUE_NUMBER is not set, skipping");
    return;
  }

  const config = await lib.getConfig();
  const driftIssueRepo = lib.getDriftIssueRepo(config);

  const inputs: Inputs = {
    ghToken: input.getRequiredGitHubToken(),
    status: input.getRequiredStatus(),
    issueNumber: parseInt(issueNumberStr, 10),
    issueState: env.tfactionDriftIssueState,
    repoOwner: driftIssueRepo.owner,
    repoName: driftIssueRepo.name,
    skipTerraform: env.tfactionSkipTerraform,
  };

  await run(inputs);
};

const run = async (inputs: Inputs) => {
  if (inputs.issueNumber === undefined) {
    return;
  }

  // Post comment if job failed
  if (inputs.status !== "success") {
    await postCommentIfNeeded(inputs);
  }

  // Close the drift issue if job succeeded and terraform wasn't skipped
  if (
    inputs.issueState === "open" &&
    inputs.status === "success" &&
    !inputs.skipTerraform
  ) {
    core.info("Closing drift issue");
    await closeIssue(inputs);
  }

  // Reopen the drift issue if it was closed and job failed
  if (inputs.issueState === "closed" && inputs.status !== "success") {
    core.info("Reopening drift issue");
    await reopenIssue(inputs);
  }
};

const getJobUrl = (): string => {
  const serverUrl = env.githubServerUrl || "https://github.com";
  const repo = env.githubRepository;
  const runId = env.githubRunId;
  return `${serverUrl}/${repo}/actions/runs/${runId}`;
};

const getLatestCommentBody = async (inputs: Inputs): Promise<string> => {
  const octokit = github.getOctokit(inputs.ghToken);
  const query = `
    query($owner: String!, $name: String!, $issueNumber: Int!) {
      repository(owner: $owner, name: $name) {
        issue(number: $issueNumber) {
          comments(last: 1) {
            nodes {
              body
            }
          }
        }
      }
    }
  `;

  const result: {
    repository: {
      issue: {
        comments: {
          nodes: Array<{ body: string }>;
        };
      };
    };
  } = await octokit.graphql(query, {
    owner: inputs.repoOwner,
    name: inputs.repoName,
    issueNumber: inputs.issueNumber,
  });

  return result.repository.issue.comments.nodes[0]?.body ?? "";
};

const postCommentIfNeeded = async (inputs: Inputs) => {
  if (inputs.issueNumber === undefined) {
    return;
  }

  const jobUrl = getJobUrl();
  const latestCommentBody = await getLatestCommentBody(inputs);

  // If the latest comment already contains the job URL, skip posting
  if (latestCommentBody.includes(jobUrl)) {
    core.info("Latest comment already contains the job URL, skipping");
    return;
  }

  const comment = `## :x: CI failed

[Build link](${jobUrl})
`;

  const octokit = github.getOctokit(inputs.ghToken);
  await octokit.rest.issues.createComment({
    owner: inputs.repoOwner,
    repo: inputs.repoName,
    issue_number: inputs.issueNumber,
    body: comment,
  });
  core.info("Posted a comment to the drift issue");
};

const closeIssue = async (inputs: Inputs) => {
  if (inputs.issueNumber === undefined) {
    return;
  }
  const octokit = github.getOctokit(inputs.ghToken);
  await octokit.rest.issues.update({
    owner: inputs.repoOwner,
    repo: inputs.repoName,
    issue_number: inputs.issueNumber,
    state: "closed",
  });
};

const reopenIssue = async (inputs: Inputs) => {
  if (inputs.issueNumber === undefined) {
    return;
  }
  const octokit = github.getOctokit(inputs.ghToken);
  await octokit.rest.issues.update({
    owner: inputs.repoOwner,
    repo: inputs.repoName,
    issue_number: inputs.issueNumber,
    state: "open",
  });
};
