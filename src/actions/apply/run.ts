import * as github from "@actions/github";

// Type definitions for testable business logic

export type Logger = {
  info: (message: string) => void;
  notice: (message: string) => void;
  warning: (message: string) => void;
};

export type OctokitType = ReturnType<typeof github.getOctokit>;

// Interface for update-branch-action update function
export type UpdateBranchFn = (params: {
  octokit: OctokitType;
  owner: string;
  repo: string;
  pullRequestNumber: number;
  serverRepositoryOwner: string;
  serverRepositoryName: string;
}) => Promise<void>;

// Input for listRelatedPullRequests
export type ListRelatedPullRequestsInput = {
  octokit: OctokitType;
  owner: string;
  repo: string;
  target: string;
};

// Input for updateBranchByCommit
export type UpdateBranchByCommitInput = {
  octokit: OctokitType;
  owner: string;
  repo: string;
  prNumbers: number[];
  logger: Logger;
};

// Input for updateBranchBySecurefix
export type UpdateBranchBySecurefixInput = {
  octokit: OctokitType;
  serverRepoOwner: string;
  serverRepoName: string;
  owner: string;
  repo: string;
  serverUrl: string;
  prNumbers: number[];
  updateBranchFn: UpdateBranchFn;
  logger: Logger;
};

// Build the search query for finding related pull requests
export const buildSearchQuery = (
  owner: string,
  repo: string,
  target: string,
): string => {
  return `repo:${owner}/${repo} is:pr is:open label:"${target}" -label:tfaction:disable-auto-update`;
};

// Parse the GraphQL result to extract PR numbers
export const parseGraphQLResult = (result: {
  search: {
    nodes: Array<{ number: number }>;
  };
}): number[] => {
  return result.search.nodes.map((pr) => pr.number);
};

// List related pull requests using GraphQL
export const listRelatedPullRequests = async (
  input: ListRelatedPullRequestsInput,
): Promise<number[]> => {
  const { octokit, owner, repo, target } = input;
  const query = buildSearchQuery(owner, repo, target);

  const result: {
    search: {
      nodes: Array<{ number: number }>;
    };
  } = await octokit.graphql(
    `
    query($q: String!) {
      search(query: $q, type: ISSUE, first: 100) {
        nodes {
          ... on PullRequest {
            number
          }
        }
      }
    }
  `,
    { q: query },
  );

  return parseGraphQLResult(result);
};

// Update branches by creating commits via GitHub API
export const updateBranchByCommit = async (
  input: UpdateBranchByCommitInput,
): Promise<void> => {
  const { octokit, owner, repo, prNumbers, logger } = input;

  for (const prNumber of prNumbers) {
    try {
      const { data } = await octokit.rest.pulls.updateBranch({
        owner,
        repo,
        pull_number: prNumber,
      });
      logger.notice(`Updated a branch ${data.url}`);
    } catch (error) {
      logger.warning(`Failed to update branch for PR #${prNumber}: ${error}`);
    }
  }
};

// Update branches using securefix action
export const updateBranchBySecurefix = async (
  input: UpdateBranchBySecurefixInput,
): Promise<void> => {
  const {
    octokit,
    serverRepoOwner,
    serverRepoName,
    owner,
    repo,
    serverUrl,
    prNumbers,
    updateBranchFn,
    logger,
  } = input;

  for (const prNumber of prNumbers) {
    try {
      logger.info(
        `Updating a branch ${serverUrl}/${owner}/${repo}/pull/${prNumber}`,
      );
      await updateBranchFn({
        octokit,
        owner,
        repo,
        pullRequestNumber: prNumber,
        serverRepositoryOwner: serverRepoOwner,
        serverRepositoryName: serverRepoName,
      });
    } catch (error) {
      logger.warning(`Failed to update branch for PR #${prNumber}: ${error}`);
    }
  }
};
