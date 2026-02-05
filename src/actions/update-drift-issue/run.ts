import * as core from "@actions/core";

export type Octokit = {
  graphql: <T>(query: string, variables: Record<string, unknown>) => Promise<T>;
  rest: {
    issues: {
      createComment: (params: {
        owner: string;
        repo: string;
        issue_number: number;
        body: string;
      }) => Promise<unknown>;
      update: (params: {
        owner: string;
        repo: string;
        issue_number: number;
        state: "open" | "closed";
      }) => Promise<unknown>;
    };
  };
};

export type RunInput = {
  status: string;
  issueNumber: number | undefined;
  issueState: string | undefined;
  repoOwner: string;
  repoName: string;
  skipTerraform: boolean;
  runURL: string;
  octokit: Octokit;
  logger?: {
    info: (msg: string) => void;
  };
};

const getLatestCommentBody = async (input: RunInput): Promise<string> => {
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

  const result = await input.octokit.graphql<{
    repository: {
      issue: {
        comments: {
          nodes: Array<{ body: string }>;
        };
      };
    };
  }>(query, {
    owner: input.repoOwner,
    name: input.repoName,
    issueNumber: input.issueNumber,
  });

  return result.repository.issue.comments.nodes[0]?.body ?? "";
};

const postCommentIfNeeded = async (input: RunInput) => {
  if (input.issueNumber === undefined) {
    return;
  }

  const log = input.logger ?? core;

  const latestCommentBody = await getLatestCommentBody(input);

  // If the latest comment already contains the job URL, skip posting
  if (latestCommentBody.includes(input.runURL)) {
    log.info("Latest comment already contains the job URL, skipping");
    return;
  }

  const comment = `## :x: CI failed

[Build link](${input.runURL})
`;

  await input.octokit.rest.issues.createComment({
    owner: input.repoOwner,
    repo: input.repoName,
    issue_number: input.issueNumber,
    body: comment,
  });
  log.info("Posted a comment to the drift issue");
};

const closeIssue = async (input: RunInput) => {
  if (input.issueNumber === undefined) {
    return;
  }
  await input.octokit.rest.issues.update({
    owner: input.repoOwner,
    repo: input.repoName,
    issue_number: input.issueNumber,
    state: "closed",
  });
};

const reopenIssue = async (input: RunInput) => {
  if (input.issueNumber === undefined) {
    return;
  }
  await input.octokit.rest.issues.update({
    owner: input.repoOwner,
    repo: input.repoName,
    issue_number: input.issueNumber,
    state: "open",
  });
};

export const run = async (input: RunInput): Promise<void> => {
  if (input.issueNumber === undefined) {
    return;
  }

  const log = input.logger ?? core;

  // Post comment if job failed
  if (input.status !== "success") {
    await postCommentIfNeeded(input);
  }

  // Close the drift issue if job succeeded and terraform wasn't skipped
  if (
    input.issueState === "open" &&
    input.status === "success" &&
    !input.skipTerraform
  ) {
    log.info("Closing drift issue");
    await closeIssue(input);
  }

  // Reopen the drift issue if it was closed and job failed
  if (input.issueState === "closed" && input.status !== "success") {
    log.info("Reopening drift issue");
    await reopenIssue(input);
  }
};
