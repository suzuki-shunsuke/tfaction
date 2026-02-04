import * as lib from "../../lib";
import * as types from "../../lib/types";
import * as drift from "../../lib/drift";
import * as path from "path";

export type GraphQLPaginator = {
  graphql: {
    paginate: {
      iterator: <T>(
        query: string,
        variables: Record<string, unknown>,
      ) => AsyncIterable<T>;
    };
  };
};

export type Logger = {
  info: (message: string) => void;
};

export type Result = {
  number: number;
  state: string;
  url: string;
};

type Issue = {
  url: string;
  number: number;
  state: string;
};

export type RunInput = {
  config: types.Config;
  target?: string;
  workingDir?: string;
  ghToken: string;
  repo?: string;
  graphqlOctokit: GraphQLPaginator;
  logger: Logger;
};

export type GetTargetGroupFn = (
  config: {
    config_path: string;
    working_directory_file: string;
    target_groups: types.TargetGroup[];
    replace_target?: types.Replace | undefined;
  },
  target?: string,
  workingDir?: string,
) => Promise<lib.Target>;

export type ReadTargetConfigFn = (p: string) => types.TargetConfig;

export type CreateIssueFn = (
  target: string,
  ghToken: string,
  repoOwner: string,
  repoName: string,
) => Promise<Issue>;

export type RunDependencies = {
  getTargetGroup: GetTargetGroupFn;
  readTargetConfig: ReadTargetConfigFn;
  checkDriftDetectionEnabled: typeof drift.checkDriftDetectionEnabled;
  createIssue: CreateIssueFn;
};

export const defaultDependencies: RunDependencies = {
  getTargetGroup: lib.getTargetGroup,
  readTargetConfig: lib.readTargetConfig,
  checkDriftDetectionEnabled: drift.checkDriftDetectionEnabled,
  createIssue: drift.createIssue,
};

export const getIssue = async (
  target: string,
  graphqlOctokit: GraphQLPaginator,
  repo: string,
): Promise<Issue | undefined> => {
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

  const pageIterator = graphqlOctokit.graphql.paginate.iterator<{
    search: {
      nodes: Array<{
        number: number;
        title: string;
        state: string;
        url: string;
      }>;
    };
  }>(query, {
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

export const run = async (
  input: RunInput,
  deps: RunDependencies = defaultDependencies,
): Promise<Result | undefined> => {
  const { config, ghToken, logger, graphqlOctokit } = input;

  if (!config.drift_detection) {
    logger.info("drift detection is disabled");
    return undefined;
  }

  const repoOwner =
    config.drift_detection.issue_repo_owner ?? (input.repo ?? "").split("/")[0];
  const repoName =
    config.drift_detection.issue_repo_name ?? (input.repo ?? "").split("/")[1];
  if (!repoOwner || !repoName) {
    throw new Error("repo_owner and repo_name are required");
  }
  const tg = await deps.getTargetGroup(config, input.target, input.workingDir);

  const wdConfig = deps.readTargetConfig(
    path.join(
      config.git_root_dir,
      tg.workingDir,
      config.working_directory_file,
    ),
  );

  if (!deps.checkDriftDetectionEnabled(config, tg.group, wdConfig)) {
    logger.info("drift detection is disabled");
    return;
  }
  logger.info("drift detection is enabled");

  if (!ghToken) {
    throw new Error("GITHUB_TOKEN is required");
  }

  let issue = await getIssue(
    tg.target,
    graphqlOctokit,
    `${repoOwner}/${repoName}`,
  );
  if (issue === undefined) {
    logger.info("creating a drift issue");
    issue = await deps.createIssue(tg.target, ghToken, repoOwner, repoName);
  }

  return {
    number: issue.number,
    state: issue.state,
    url: issue.url,
  };
};
