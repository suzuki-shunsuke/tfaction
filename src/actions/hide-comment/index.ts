import * as core from "@actions/core";
import * as github from "@actions/github";

import * as input from "../../lib/input";
import * as env from "../../lib/env";
import { run } from "./run";

export const main = async () => {
  const githubToken = input.getRequiredGitHubToken();
  const octokit = github.getOctokit(githubToken);
  const ifCondition = input.getIf();
  const prNumber =
    github.context.issue.number || Number(env.all.CI_INFO_PR_NUMBER);
  const commitSHA = github.context.sha;

  if (!prNumber) {
    throw new Error("pr number is missing");
  }

  const result = await run({
    octokit,
    repoOwner: github.context.repo.owner,
    repoName: github.context.repo.repo,
    prNumber,
    commitSHA,
    ifCondition,
    logger: { info: core.info, debug: core.debug },
  });

  core.info(`Hidden ${result.hiddenCount} of ${result.totalCount} comments`);
};
