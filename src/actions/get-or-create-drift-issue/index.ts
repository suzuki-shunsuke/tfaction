import * as core from "@actions/core";
import { Octokit } from "@octokit/core";
import { paginateGraphQL } from "@octokit/plugin-paginate-graphql";
import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import { run } from "./run";

export const main = async () => {
  const cfg = await lib.getConfig();
  if (!cfg.drift_detection) {
    // drift detection is disabled
    return;
  }

  const ghToken = input.getRequiredGitHubToken();
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
};
