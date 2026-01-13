import * as core from "@actions/core";
import * as github from "@actions/github";
import { Octokit } from "@octokit/core";
import { paginateGraphQL } from "@octokit/plugin-paginate-graphql";
import * as lib from "../lib";
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
  title: string;
  target: string;
};

export const main = async () => {
  const cfg = lib.getConfig();
  if (!cfg.drift_detection) {
    // dirft detection is disabled
    return;
  }

  const result = await run({
    target: lib.getTargetFromEnv(),
    workingDir: lib.getWorkingDirFromEnv(),
    ghToken: core.getInput("github_token", { required: true }),
    repo: process.env.GITHUB_REPOSITORY,
  });

  if (result === undefined) {
    return;
  }

  core.exportVariable("TFACTION_DRIFT_ISSUE_NUMBER", result.number);
  core.exportVariable("TFACTION_DRIFT_ISSUE_STATE", result.state);
  core.info(result.url);
  core.summary.addRaw(`Drift Issue: ${result.url}`, true);
};

const run = async (inputs: Inputs): Promise<Result | undefined> => {
  if (inputs.ghToken === "") {
    throw new Error("GITHUB_TOKEN is required");
  }
  const cfg = lib.getConfig();
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
  const workingDirectoryFile = cfg.working_directory_file;

  const configDir = path.dirname(cfg.config_path);
  const gitRootDir = await lib.getGitRootDir(configDir);
  const files = await lib.listWorkingDirFiles(
    gitRootDir,
    configDir,
    workingDirectoryFile,
  );
  const dirs: string[] = [];
  for (const file of files) {
    dirs.push(path.dirname(file));
  }

  // map working directories and targets
  const m = lib.createWDTargetMap(dirs, cfg);
  const targetWDMap = new Map<string, string>();
  for (const [wd, target] of m) {
    const tg = await lib.getTargetGroup(cfg, target, wd);
    const wdConfig = lib.readTargetConfig(
      path.join(configDir, wd, cfg.working_directory_file),
    );
    if (lib.checkDriftDetectionEnabled(cfg, tg.group, wdConfig)) {
      targetWDMap.set(target, wd);
    }
  }

  // search github issues
  const issues = await listIssues(repoOwner + "/" + repoName, inputs.ghToken);
  core.debug(`found ${issues.length} issues`);
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
    const issue = await lib.createIssue(
      target,
      inputs.ghToken,
      repoOwner,
      repoName,
    );
    core.info(`Created an issue for ${target}: ${issue.url}`);
    await closeIssue(inputs.ghToken, repoOwner, repoName, issue.number);
    issueMap.set(target, issue);
  }
  // archive issues if targets don't exist
  for (const [target, issue] of issueMap) {
    if (targetWDMap.has(target)) {
      continue;
    }
    core.info(`Archiving an issue for ${target}`);
    await archiveIssue(
      inputs.ghToken,
      repoOwner,
      repoName,
      issue.title,
      issue.number,
    );
  }
};

const titlePattern = /^Terraform Drift \((\S+)\)$/;

const closeIssue = async (
  ghToken: string,
  repoOwner: string,
  repoName: string,
  num: number,
) => {
  const octokit = github.getOctokit(ghToken);
  await octokit.rest.issues.update({
    owner: repoOwner,
    repo: repoName,
    issue_number: num,
    state: "closed",
  });
};

const archiveIssue = async (
  ghToken: string,
  repoOwner: string,
  repoName: string,
  title: string,
  num: number,
) => {
  const octokit = github.getOctokit(ghToken);
  await octokit.rest.issues.update({
    owner: repoOwner,
    repo: repoName,
    issue_number: num,
    title: `Archived ${title}`,
    state: "closed",
  });
};

const listIssues = async (repo: string, ghToken: string): Promise<Issue[]> => {
  const MyOctokit = Octokit.plugin(paginateGraphQL);
  const octokit = new MyOctokit({ auth: ghToken });

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

  const pageIterator = await octokit.graphql.paginate.iterator(query, {
    issuesCursor: null,
    searchQuery: `repo:${repo} "Terraform Drift" in:title`,
  });

  const issues: Issue[] = [];
  for await (const response of pageIterator) {
    core.debug("response: " + JSON.stringify(response));
    for (const issue of response.search.nodes) {
      // extract target from the title
      const found = issue.title.match(titlePattern);
      if (found === null) {
        continue;
      }
      issue.target = found[1];
      issues.push(issue);
    }
  }
  return issues;
};
