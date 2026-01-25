import * as github from "@actions/github";
import { Octokit } from "@octokit/core";
import { paginateGraphQL } from "@octokit/plugin-paginate-graphql";
import * as lib from "../../lib";
import * as types from "../../lib/types";
import * as drift from "../../lib/drift";
import * as git from "../../lib/git";
import * as path from "path";

export type Issue = drift.Issue;

export type Result = {
  number: number;
  state: string;
  url: string;
};

export type Logger = {
  info: (message: string) => void;
  debug: (message: string) => void;
};

// GraphQL paginator type
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

export type RunInput = {
  octokit: ReturnType<typeof github.getOctokit>;
  graphqlOctokit: GraphQLPaginator;
  repoOwner: string;
  repoName: string;
  config: types.Config;
  logger: Logger;
};

export const titlePattern = /^Terraform Drift \((\S+)\)$/;

export const listIssues = async (
  graphqlOctokit: GraphQLPaginator,
  repo: string,
  logger: Logger,
): Promise<Issue[]> => {
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
    searchQuery: `repo:${repo} "Terraform Drift" in:title`,
  });

  const issues: Issue[] = [];
  for await (const response of pageIterator) {
    logger.debug("response: " + JSON.stringify(response));
    for (const issue of response.search.nodes) {
      // extract target from the title
      const found = issue.title.match(titlePattern);
      if (found === null) {
        continue;
      }
      issues.push({
        ...issue,
        target: found[1],
      });
    }
  }
  return issues;
};

export const closeIssue = async (
  octokit: ReturnType<typeof github.getOctokit>,
  repoOwner: string,
  repoName: string,
  num: number,
): Promise<void> => {
  await octokit.rest.issues.update({
    owner: repoOwner,
    repo: repoName,
    issue_number: num,
    state: "closed",
  });
};

export const archiveIssue = async (
  octokit: ReturnType<typeof github.getOctokit>,
  repoOwner: string,
  repoName: string,
  title: string,
  num: number,
): Promise<void> => {
  await octokit.rest.issues.update({
    owner: repoOwner,
    repo: repoName,
    issue_number: num,
    title: `Archived ${title}`,
    state: "closed",
  });
};

export type CreateIssueFn = (
  target: string,
  ghToken: string,
  repoOwner: string,
  repoName: string,
) => Promise<drift.Issue>;

export type ListWorkingDirFilesFn = (
  gitRootDir: string,
  fileName: string,
) => Promise<string[]>;

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

export type RunDependencies = {
  createIssue: CreateIssueFn;
  listWorkingDirFiles: ListWorkingDirFilesFn;
  getTargetGroup: GetTargetGroupFn;
  readTargetConfig: ReadTargetConfigFn;
  checkDriftDetectionEnabled: typeof drift.checkDriftDetectionEnabled;
};

export const defaultDependencies: RunDependencies = {
  createIssue: drift.createIssue,
  listWorkingDirFiles: git.listWorkingDirFiles,
  getTargetGroup: lib.getTargetGroup,
  readTargetConfig: lib.readTargetConfig,
  checkDriftDetectionEnabled: drift.checkDriftDetectionEnabled,
};

export const run = async (
  input: RunInput,
  ghToken: string,
  deps: RunDependencies = defaultDependencies,
): Promise<Result | undefined> => {
  const { octokit, graphqlOctokit, repoOwner, repoName, config, logger } =
    input;

  if (!config.drift_detection) {
    logger.info("drift detection is disabled");
    return undefined;
  }

  const workingDirectoryFile = config.working_directory_file;

  const files = await deps.listWorkingDirFiles(
    config.git_root_dir,
    workingDirectoryFile,
  );
  const dirs = files.map((file) => path.dirname(file));

  // map working directories and targets
  const m = lib.createWDTargetMap(
    dirs,
    config.target_groups,
    config.replace_target,
  );
  const targetWDMap = new Map<string, string>();
  for (const [wd, target] of m) {
    const tg = await deps.getTargetGroup(config, target, wd);
    const wdConfig = deps.readTargetConfig(
      path.join(config.git_root_dir, wd, config.working_directory_file),
    );
    if (deps.checkDriftDetectionEnabled(config, tg.group, wdConfig)) {
      targetWDMap.set(target, wd);
    }
  }

  // search github issues
  const issues = await listIssues(
    graphqlOctokit,
    repoOwner + "/" + repoName,
    logger,
  );
  logger.debug(`found ${issues.length} issues`);
  // map issues and targets
  const issueMap = new Map<string, Issue>();
  for (const issue of issues) {
    issueMap.set(issue.target, issue);
  }

  // create issues if not exists
  for (const target of m.values()) {
    if (issueMap.has(target)) {
      continue;
    }
    const issue = await deps.createIssue(target, ghToken, repoOwner, repoName);
    logger.info(`Created an issue for ${target}: ${issue.url}`);
    await closeIssue(octokit, repoOwner, repoName, issue.number);
    issueMap.set(target, issue);
  }
  // archive issues if targets don't exist
  for (const [target, issue] of issueMap) {
    if (targetWDMap.has(target)) {
      continue;
    }
    logger.info(`Archiving an issue for ${target}`);
    await archiveIssue(octokit, repoOwner, repoName, issue.title, issue.number);
  }

  return undefined;
};

export const createGraphQLOctokit = (ghToken: string): GraphQLPaginator => {
  const MyOctokit = Octokit.plugin(paginateGraphQL);
  return new MyOctokit({ auth: ghToken });
};
