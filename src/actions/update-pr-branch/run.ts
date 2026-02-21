import * as github from "@actions/github";
import {
  listRelatedPullRequests,
  updateBranchByCommit,
  updateBranchBySecurefix,
  type UpdateBranchFn,
  type Logger,
} from "../apply/run";

export type RunInput = {
  githubToken: string;
  target: string;
  disableUpdateRelatedPullRequests: boolean;
  csmActionsServerRepository: string;
  csmAppId: string;
  csmAppPrivateKey: string;
  repoOwner: string;
  repoName: string;
  serverUrl: string;
  updateBranchFn: UpdateBranchFn;
  createGithubAppToken: (params: {
    appId: string;
    privateKey: string;
    owner: string;
    repositories: string[];
    permissions: Record<string, string>;
  }) => Promise<{ token: string; expiresAt: string }>;
  hasExpired: (expiresAt: string) => boolean;
  revokeToken: (token: string) => Promise<void>;
  logger: Logger;
};

export const run = async (input: RunInput): Promise<void> => {
  if (input.disableUpdateRelatedPullRequests) {
    input.logger.info("Skip updating related pull requests");
    return;
  }

  const octokit = github.getOctokit(input.githubToken);
  const prNumbers = await listRelatedPullRequests({
    octokit,
    owner: input.repoOwner,
    repo: input.repoName,
    target: input.target,
  });

  if (input.csmActionsServerRepository) {
    const token = await input.createGithubAppToken({
      appId: input.csmAppId,
      privateKey: input.csmAppPrivateKey,
      owner: input.repoOwner,
      repositories: [input.csmActionsServerRepository],
      permissions: {
        issues: "write",
      },
    });
    try {
      const csmOctokit = github.getOctokit(token.token);
      await updateBranchBySecurefix({
        octokit: csmOctokit,
        serverRepoOwner: input.repoOwner,
        serverRepoName: input.csmActionsServerRepository,
        owner: input.repoOwner,
        repo: input.repoName,
        serverUrl: input.serverUrl,
        prNumbers,
        updateBranchFn: input.updateBranchFn,
        logger: input.logger,
      });
    } finally {
      if (token && !input.hasExpired(token.expiresAt)) {
        input.logger.info("Revoking GitHub App token");
        await input.revokeToken(token.token);
      }
    }
  } else {
    await updateBranchByCommit({
      octokit,
      owner: input.repoOwner,
      repo: input.repoName,
      prNumbers,
      logger: input.logger,
    });
  }
};
