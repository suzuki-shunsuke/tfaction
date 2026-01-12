import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as github from "@actions/github";
import * as path from "path";

import * as lib from "../lib";
import * as listFiles from "../list-targets/list-targets-with-changed-files/list_files";

type Issue = {
  number: number;
  title: string;
  target: string;
  state: string;
  runs_on: string;
};

const titlePattern = /^Terraform Drift \((\S+)\)$/;

// Calculate deadline (minimum_detection_interval hours ago)
const getDeadline = (now: Date, durationHours: number): string => {
  const deadline = new Date(now.getTime() - durationHours * 60 * 60 * 1000);
  return deadline.toISOString().replace(/\.\d{3}Z$/, "+00:00");
};

// List least recently updated drift issues using GraphQL
const listLeastRecentlyUpdatedIssues = async (
  octokit: ReturnType<typeof github.getOctokit>,
  repoOwner: string,
  repoName: string,
  numOfIssues: number,
  deadline: string,
): Promise<Issue[]> => {
  const query = `
    query($searchQuery: String!, $cursor: String) {
      search(first: 100, after: $cursor, query: $searchQuery, type: ISSUE) {
        nodes {
          ... on Issue {
            number
            title
            state
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  `;

  const searchQuery = `repo:${repoOwner}/${repoName} "Terraform Drift" in:title sort:updated-asc updated:<${deadline}`;
  const issues: Issue[] = [];
  let cursor: string | null = null;

  while (true) {
    const result: {
      search: {
        nodes: Array<{
          number: number;
          title: string;
          state: string;
        }>;
        pageInfo: {
          endCursor: string;
          hasNextPage: boolean;
        };
      };
    } = await octokit.graphql(query, {
      searchQuery,
      cursor,
    });

    for (const node of result.search.nodes) {
      const match = titlePattern.exec(node.title);
      if (!match) {
        continue;
      }
      issues.push({
        number: node.number,
        title: node.title,
        target: match[1],
        state: node.state.toLowerCase(),
        runs_on: "",
      });
      if (issues.length >= numOfIssues) {
        return issues;
      }
    }

    if (!result.search.pageInfo.hasNextPage) {
      break;
    }
    cursor = result.search.pageInfo.endCursor;
  }

  return issues;
};

// Archive issue (close & rename)
const archiveIssue = async (
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  issueNumber: number,
  title: string,
): Promise<void> => {
  await octokit.rest.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    state: "closed",
    title,
  });
  core.info(`Archived issue #${issueNumber}`);
};

// Check if drift detection is enabled
const checkEnabled = (
  config: lib.Config,
  targetGroup: lib.TargetGroup,
  wdConfig: lib.TargetConfig,
): boolean => {
  // Check wdConfig first
  if (wdConfig.drift_detection !== undefined) {
    if (wdConfig.drift_detection.enabled !== undefined) {
      return wdConfig.drift_detection.enabled;
    }
    return true;
  }
  // Check targetGroup
  if (targetGroup.drift_detection !== undefined) {
    if (targetGroup.drift_detection.enabled !== undefined) {
      return targetGroup.drift_detection.enabled;
    }
    return true;
  }
  // Check config
  return (
    config.drift_detection?.enabled === undefined ||
    config.drift_detection.enabled
  );
};

// Get runs_on value with priority: wdConfig.terraform_plan_config > wdConfig > targetGroup.terraform_plan_config > targetGroup > config
const getRunsOn = (
  config: lib.Config,
  targetGroup: lib.TargetGroup,
  wdConfig: lib.TargetConfig,
): string => {
  const candidates = [
    wdConfig.terraform_plan_config?.runs_on,
    targetGroup.terraform_plan_config?.runs_on,
    targetGroup.runs_on,
    config.target_groups[0]?.runs_on, // fallback to first target group if exists
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined) {
      if (Array.isArray(candidate)) {
        return JSON.stringify(candidate);
      }
      return candidate;
    }
  }

  return "ubuntu-latest";
};

// Get target name from working directory path
const getTargetByWorkingDirectory = (
  workingDirectoryPath: string,
  config: lib.Config,
): string => {
  for (const pattern of config.replace?.patterns ?? []) {
    workingDirectoryPath = workingDirectoryPath.replace(
      new RegExp(pattern.regexp),
      pattern.replace,
    );
  }
  return workingDirectoryPath;
};

// List working directory files using git ls-files
const listWorkingDirectoryFiles = async (
  baseWorkingDirectory: string,
  workingDirectoryFile: string,
): Promise<string[]> => {
  let output = "";
  await exec.exec("git", ["ls-files", baseWorkingDirectory], {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
    },
  });
  return output
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => f.length > 0 && path.basename(f) === workingDirectoryFile);
};

// List targets with runs_on
const listTargets = async (
  config: lib.Config,
): Promise<Map<string, string>> => {
  const configDir = path.dirname(config.config_path);
  const gitRootDir = await lib.getGitRootDir(configDir);
  const files = await listFiles.listFiles(
    gitRootDir,
    configDir,
    config.working_directory_file,
  );

  const targets = new Map<string, string>();
  const pwd = process.env.GITHUB_WORKSPACE ?? process.cwd();

  for (const file of files) {
    const workingDirectoryPath = path.dirname(file);

    // Find matching target group
    const targetGroup = lib.getTargetFromTargetGroupsByWorkingDir(
      config.target_groups,
      workingDirectoryPath,
    );
    if (!targetGroup) {
      continue;
    }

    // Read working directory config
    let wdConfig: lib.TargetConfig;
    try {
      wdConfig = lib.readTargetConfig(path.join(pwd, file));
    } catch {
      continue;
    }

    // Check if drift detection is enabled
    if (!checkEnabled(config, targetGroup, wdConfig)) {
      continue;
    }

    // Get target and runs_on
    const target = getTargetByWorkingDirectory(workingDirectoryPath, config);
    const runsOn = getRunsOn(config, targetGroup, wdConfig);

    targets.set(target, runsOn);
  }

  return targets;
};

/**
 *
 * @returns
 */
export const main = async () => {
  const githubToken = core.getInput("github_token", { required: true });
  const config = lib.getConfig();

  // If drift_detection is not configured, output empty
  if (!config.drift_detection) {
    core.setOutput("has_issues", "false");
    core.setOutput("issues", "[]");
    return;
  }

  const repoOwner =
    config.drift_detection.issue_repo_owner || github.context.repo.owner;
  const repoName =
    config.drift_detection.issue_repo_name || github.context.repo.repo;

  // List targets with runs_on
  const targets = await listTargets(config);
  core.debug(`Found ${targets.size} targets with drift detection enabled`);

  // Calculate deadline
  const deadline = getDeadline(
    new Date(),
    config.drift_detection.minimum_detection_interval ?? 24,
  );
  core.info(`Deadline: ${deadline}`);

  // List least recently updated drift issues
  const octokit = github.getOctokit(githubToken);
  const issues = await listLeastRecentlyUpdatedIssues(
    octokit,
    repoOwner,
    repoName,
    config.drift_detection.num_of_issues ?? 1,
    deadline,
  );
  core.debug(`Found ${issues.length} drift issues`);

  // Filter issues and archive orphaned ones
  const result: Issue[] = [];
  for (const issue of issues) {
    const runsOn = targets.get(issue.target);
    if (runsOn !== undefined) {
      result.push({ ...issue, runs_on: runsOn });
    } else {
      // If there is no target associated with the issue, archive the issue.
      core.notice(
        `Target ${issue.target} not found, archiving issue ${github.context.serverUrl}/${repoOwner}/${repoName}/issues/${issue.number}`,
      );
      await archiveIssue(
        octokit,
        repoOwner,
        repoName,
        issue.number,
        "Archived " + issue.title,
      );
    }
  }

  // Set outputs
  core.setOutput("has_issues", result.length > 0 ? "true" : "false");
  core.setOutput("issues", JSON.stringify(result));
  core.info(`Output ${result.length} issues`);
};
