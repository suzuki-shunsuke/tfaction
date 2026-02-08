import * as core from "@actions/core";
import { Octokit } from "@octokit/core";
import { paginateGraphQL } from "@octokit/plugin-paginate-graphql";
import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import * as githubApp from "../../lib/github-app";
import { run } from "./run";

export const main = async () => {
  const cfg = await lib.getConfig();
  if (!cfg.drift_detection) {
    // drift detection is disabled
    return;
  }

  const issueRepoOwner =
    cfg.drift_detection.issue_repo_owner ??
    env.all.GITHUB_REPOSITORY.split("/")[0];
  const issueRepoName =
    cfg.drift_detection.issue_repo_name ??
    env.all.GITHUB_REPOSITORY.split("/")[1];

  let ghToken: string;
  if (input.githubAppId && input.githubAppPrivateKey) {
    ghToken = await githubApp.createToken({
      appId: input.githubAppId,
      privateKey: input.githubAppPrivateKey,
      owner: issueRepoOwner,
      repositories: [issueRepoName],
      permissions: {
        issues: "write",
      },
    });
  } else {
    ghToken = input.getRequiredGitHubToken();
  }

  try {
    const MyOctokit = Octokit.plugin(paginateGraphQL);
    const graphqlOctokit = new MyOctokit({ auth: ghToken });

    const result = await run({
      config: cfg,
      target: env.all.TFACTION_TARGET,
      workingDir: env.all.TFACTION_WORKING_DIR,
      ghToken,
      repo: env.all.GITHUB_REPOSITORY,
      graphqlOctokit,
      logger: core,
    });

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
