import * as core from "@actions/core";
import * as github from "@actions/github";
import * as path from "path";

import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import { run } from "./run";

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
  for (const pattern of config.replace_target?.patterns ?? []) {
    workingDirectoryPath = workingDirectoryPath.replace(
      new RegExp(pattern.regexp),
      pattern.replace,
    );
  }
  return workingDirectoryPath;
};

// List targets with runs_on
const listTargets = async (
  config: lib.Config,
): Promise<Map<string, string>> => {
  const files = await lib.listWorkingDirFiles(
    config.git_root_dir,
    config.working_directory_file,
  );

  const targets = new Map<string, string>();
  const pwd = env.githubWorkspace || process.cwd();

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

export const main = async () => {
  const githubToken = input.getRequiredGitHubToken();
  const config = await lib.getConfig();

  const repoOwner =
    config.drift_detection?.issue_repo_owner || github.context.repo.owner;
  const repoName =
    config.drift_detection?.issue_repo_name || github.context.repo.repo;

  // List targets with runs_on
  const targets = await listTargets(config);
  core.debug(`Found ${targets.size} targets with drift detection enabled`);

  // Create octokit
  const octokit = github.getOctokit(githubToken);

  // Run the main logic
  const result = await run({
    driftDetection: config.drift_detection,
    octokit,
    targets,
    repoOwner,
    repoName,
    now: new Date(),
    serverUrl: github.context.serverUrl,
    logger: {
      info: core.info,
      debug: core.debug,
      notice: core.notice,
    },
  });

  // Set outputs
  core.setOutput("has_issues", result.hasIssues ? "true" : "false");
  core.setOutput("issues", JSON.stringify(result.issues));
  core.info(`Output ${result.issues.length} issues`);
};
