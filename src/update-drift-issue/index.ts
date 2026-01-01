import * as core from "@actions/core";
import * as github from "@actions/github";
import * as lib from "../lib";
import * as getGlobalConfig from "../get-global-config";

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
  const issueNumberStr = process.env.TFACTION_DRIFT_ISSUE_NUMBER;
  if (!issueNumberStr) {
    core.info("TFACTION_DRIFT_ISSUE_NUMBER is not set, skipping");
    return;
  }

  const config = lib.getConfig();
  const globalConfig = getGlobalConfig.main_(config, {
    drift_issue_number: issueNumberStr,
  });

  const inputs: Inputs = {
    ghToken: core.getInput("github_token", { required: true }),
    status: core.getInput("status", { required: true }),
    issueNumber: parseInt(issueNumberStr, 10),
    issueState: process.env.TFACTION_DRIFT_ISSUE_STATE,
    repoOwner: globalConfig.outputs.drift_issue_repo_owner,
    repoName: globalConfig.outputs.drift_issue_repo_name,
    skipTerraform: process.env.TFACTION_SKIP_TERRAFORM === "true",
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
  const serverUrl = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const runId = process.env.GITHUB_RUN_ID ?? "";
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
