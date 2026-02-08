import * as core from "@actions/core";
import * as github from "@actions/github";
import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import * as githubApp from "../../lib/github-app";
import { run, createGraphQLOctokit } from "./run";

export const main = async () => {
  const cfg = await lib.getConfig();
  if (!cfg.drift_detection) {
    // drift detection is disabled
    return;
  }

  const repoOwner =
    cfg.drift_detection.issue_repo_owner ??
    env.all.GITHUB_REPOSITORY.split("/")[0];
  const repoName =
    cfg.drift_detection.issue_repo_name ??
    env.all.GITHUB_REPOSITORY.split("/")[1];
  if (!repoOwner || !repoName) {
    throw new Error("repo_owner and repo_name are required");
  }

  let ghToken: string;
  if (input.githubAppId && input.githubAppPrivateKey) {
    ghToken = await githubApp.createToken({
      appId: input.githubAppId,
      privateKey: input.githubAppPrivateKey,
      owner: repoOwner,
      repositories: [repoName],
      permissions: {
        issues: "write",
      },
    });
  } else {
    ghToken = input.getRequiredGitHubToken();
    if (ghToken === "") {
      throw new Error("GITHUB_TOKEN is required");
    }
  }

  try {
    const result = await run(
      {
        octokit: github.getOctokit(ghToken),
        graphqlOctokit: createGraphQLOctokit(ghToken),
        repoOwner,
        repoName,
        config: cfg,
        logger: {
          info: core.info,
          debug: core.debug,
        },
      },
      ghToken,
    );

    if (result === undefined) {
      return;
    }

    core.exportVariable("TFACTION_DRIFT_ISSUE_NUMBER", result.number);
    core.exportVariable("TFACTION_DRIFT_ISSUE_STATE", result.state);
    core.info(result.url);
    core.summary.addRaw(`Drift Issue: ${result.url}`, true);
  } finally {
    await githubApp.revokeAll();
  }
};
