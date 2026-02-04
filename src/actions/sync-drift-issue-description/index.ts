import * as github from "@actions/github";
import * as input from "../../lib/input";
import { run, type Comment } from "./run";

export const main = async () => {
  const ghToken = input.getRequiredGitHubToken();
  const octokit = github.getOctokit(ghToken);

  const issueNumber = github.context.payload.issue?.number;
  if (!issueNumber) {
    throw new Error("issue number is required");
  }

  const comment = github.context.payload.comment;
  if (!comment) {
    throw new Error("comment is required");
  }

  await run({
    issueNumber,
    comment: comment as Comment,
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    octokit,
  });
};
