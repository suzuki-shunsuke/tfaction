import * as core from "@actions/core";
import { Octokit } from "@octokit/core";
import { paginateGraphQL } from "@octokit/plugin-paginate-graphql";
import * as lib from "../lib";
import * as env from "../lib/env";
import * as path from "path";

type Inputs = {
  target?: string;
  workingDir?: string;
  ghToken: string;
  repo?: string;
};

type Result = {
  number: number;
  state: string;
  url: string;
};

type Issue = {
  url: string;
  number: number;
  state: string;
};

export const main = async () => {
  const cfg = await lib.getConfig();
  if (!cfg.drift_detection) {
    // dirft detection is disabled
    return;
  }

  const result = await run(cfg, {
    target: lib.getTargetFromEnv(),
    workingDir: lib.getWorkingDirFromEnv(),
    ghToken: core.getInput("github_token", { required: true }),
    repo: env.githubRepository,
  });

  if (result === undefined) {
    return;
  }

  core.exportVariable("TFACTION_DRIFT_ISSUE_NUMBER", result.number);
  core.exportVariable("TFACTION_DRIFT_ISSUE_STATE", result.state);
  core.info(result.url);
  core.summary.addRaw(`Drift Issue: ${result.url}`, true);
};

const run = async (
  cfg: lib.Config,
  inputs: Inputs,
): Promise<Result | undefined> => {
  if (!cfg.drift_detection) {
    core.info("drift detection is disabled");
    return undefined;
  }

  const repoOwner =
    cfg.drift_detection.issue_repo_owner ?? (inputs.repo ?? "").split("/")[0];
  const repoName =
    cfg.drift_detection.issue_repo_name ?? (inputs.repo ?? "").split("/")[1];
  if (!repoOwner || !repoName) {
    throw new Error("repo_owner and repo_name are required");
  }
  const tg = await lib.getTargetGroup(cfg, inputs.target, inputs.workingDir);

  const wdConfig = lib.readTargetConfig(
    path.join(cfg.config_dir, tg.workingDir, cfg.working_directory_file),
  );

  if (!lib.checkDriftDetectionEnabled(cfg, tg.group, wdConfig)) {
    core.info("drift detection is disabled");
    return;
  }
  core.info("drift detection is enabled");

  if (!inputs.ghToken) {
    throw new Error("GITHUB_TOKEN is required");
  }

  let issue = await getIssue(
    tg.target,
    inputs.ghToken,
    `${repoOwner}/${repoName}`,
  );
  if (issue === undefined) {
    core.info("creating a drift issue");
    issue = await lib.createIssue(
      tg.target,
      inputs.ghToken,
      repoOwner,
      repoName,
    );
  }

  return {
    number: issue.number,
    state: issue.state,
    url: issue.url,
  };
};

const getIssue = async (
  target: string,
  ghToken: string,
  repo: string,
): Promise<Issue | undefined> => {
  const MyOctokit = Octokit.plugin(paginateGraphQL);
  const octokit = new MyOctokit({ auth: ghToken });

  const title = `Terraform Drift (${target})`;
  const query = `query($cursor: String, $searchQuery: String!) {
  search(first: 100, after: $cursor, query: $searchQuery, type: ISSUE) {
    nodes {
    	... on Issue {
    		number
    		title
    		state
    		url
    	}
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`;

  const pageIterator = octokit.graphql.paginate.iterator(query, {
    issuesCursor: null,
    searchQuery: `repo:${repo} "${title}" in:title`,
  });

  for await (const response of pageIterator) {
    for (const issue of response.search.nodes) {
      if (issue.title !== title) {
        continue;
      }
      return issue;
    }
  }
  return undefined;
};
