import type { Client } from "@suzuki-shunsuke/github-app-token";
import type { NewAppOctokit } from "../../lib/app_octokit";
import * as github from "@actions/github";
import {
  listRelatedPullRequests,
  updateBranchByCommit,
  updateBranchBySecurefix,
  type UpdateBranchFn,
  type Logger,
} from "./update-branch";

export type RunInput = {
  githubToken: string;
  target: string;
  csmActionsServerRepository: string;
  newAppOctokit: NewAppOctokit;
  repoOwner: string;
  repoName: string;
  serverUrl: string;
  updateBranchFn: UpdateBranchFn;
  createGithubAppToken: (params: {
    octokit: Client;
    owner: string;
    repositories: string[];
    permissions: Record<string, string>;
  }) => Promise<{ token: string; expiresAt: string }>;
  hasExpired: (expiresAt: string) => boolean;
  revokeToken: (token: string) => Promise<void>;
  logger: Logger;
};

export const run = async (input: RunInput): Promise<void> => {
  const octokit = github.getOctokit(input.githubToken);
  const prNumbers = await listRelatedPullRequests({
    octokit,
    owner: input.repoOwner,
    repo: input.repoName,
    target: input.target,
  });

  if (input.csmActionsServerRepository) {
    const token = await input.createGithubAppToken({
      octokit: input.newAppOctokit(),
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
