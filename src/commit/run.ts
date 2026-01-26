import * as github from "@actions/github";
import * as commit from "@suzuki-shunsuke/commit-ts";

export type Logger = {
  info: (message: string) => void;
  notice: (message: string) => void;
};

export type Octokit = ReturnType<typeof github.getOctokit>;

export type PullRequest = {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
  draft?: boolean;
  comment?: string;
};

export type RunInput = {
  commitMessage: string;
  files: Set<string>;
  branch: string;
  repoOwner: string;
  repoName: string;
  octokit: Octokit;
  logger: Logger;
  pr?: PullRequest;
};

export const run = async (input: RunInput): Promise<string> => {
  const { commitMessage, files, branch, repoOwner, repoName, octokit, logger } =
    input;

  await commit.createCommit(octokit, {
    owner: repoOwner,
    repo: repoName,
    branch,
    message: commitMessage,
    files: [...files],
    deleteIfNotExist: true,
    logger: {
      info: logger.info,
    },
  });

  if (!input.pr) {
    return "";
  }

  // Get default branch for PR base
  const { data: repoData } = await octokit.rest.repos.get({
    owner: repoOwner,
    repo: repoName,
  });
  const baseBranch = repoData.default_branch;

  // Create a PR
  const { data: pr } = await octokit.rest.pulls.create({
    owner: repoOwner,
    repo: repoName,
    head: branch,
    base: baseBranch,
    title: input.pr.title,
    body: input.pr.body,
    draft: input.pr.draft,
  });
  logger.notice(`Created PR: ${pr.html_url}`);

  // Add comment if specified
  if (input.pr.comment) {
    await octokit.rest.issues.createComment({
      owner: repoOwner,
      repo: repoName,
      issue_number: pr.number,
      body: input.pr.comment,
    });
  }

  // Add labels if specified
  if (input.pr.labels && input.pr.labels.length > 0) {
    await octokit.rest.issues.addLabels({
      owner: repoOwner,
      repo: repoName,
      issue_number: pr.number,
      labels: input.pr.labels,
    });
  }

  // Add assignees if specified
  if (input.pr.assignees && input.pr.assignees.length > 0) {
    await octokit.rest.issues.addAssignees({
      owner: repoOwner,
      repo: repoName,
      issue_number: pr.number,
      assignees: input.pr.assignees,
    });
  }

  return pr.html_url;
};
