import * as core from "@actions/core";
import * as github from "@actions/github";
import * as lib from "../../lib";
import * as drift from "../../lib/drift";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import * as githubApp from "../../lib/github-app";
import { run } from "./run";

export const main = async () => {
  const issueNumberStr = env.all.TFACTION_DRIFT_ISSUE_NUMBER;
  if (!issueNumberStr) {
    core.info("TFACTION_DRIFT_ISSUE_NUMBER is not set, skipping");
    return;
  }

  const config = await lib.getConfig();
  const driftIssueRepo = drift.getDriftIssueRepo(config);

  let ghToken: string;
  if (input.githubAppId && input.githubAppPrivateKey) {
    ghToken = await githubApp.createToken({
      appId: input.githubAppId,
      privateKey: input.githubAppPrivateKey,
      owner: driftIssueRepo.owner,
      repositories: [driftIssueRepo.name],
      permissions: {
        issues: "write",
      },
    });
  } else {
    ghToken = input.getRequiredGitHubToken();
  }

  try {
    await run({
      status: input.getRequiredStatus(),
      issueNumber: parseInt(issueNumberStr, 10),
      issueState: env.all.TFACTION_DRIFT_ISSUE_STATE,
      repoOwner: driftIssueRepo.owner,
      repoName: driftIssueRepo.name,
      skipTerraform: env.TFACTION_SKIP_TERRAFORM,
      runURL: env.runURL,
      octokit: github.getOctokit(ghToken),
      logger: {
        info: core.info,
      },
    });
  } finally {
    await githubApp.revokeAll();
  }
};
