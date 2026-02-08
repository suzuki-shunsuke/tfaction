import * as github from "@actions/github";
import * as input from "../../lib/input";
import * as githubApp from "../../lib/github-app";
import { run, type Comment } from "./run";

export const main = async () => {
  const issueNumber = github.context.payload.issue?.number;
  if (!issueNumber) {
    throw new Error("issue number is required");
  }

  const comment = github.context.payload.comment;
  if (!comment) {
    throw new Error("comment is required");
  }

  let ghToken: string;
  if (input.githubAppId && input.githubAppPrivateKey) {
    ghToken = await githubApp.createToken({
      appId: input.githubAppId,
      privateKey: input.githubAppPrivateKey,
      owner: github.context.repo.owner,
      repositories: [github.context.repo.repo],
      permissions: {
        issues: "write",
      },
    });
  } else {
    ghToken = input.getRequiredGitHubToken();
  }

  try {
    const octokit = github.getOctokit(ghToken);

    await run({
      issueNumber,
      comment: comment as unknown as Comment,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      octokit,
    });
  } finally {
    await githubApp.revokeAll();
  }
};
