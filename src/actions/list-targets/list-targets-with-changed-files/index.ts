import * as core from "@actions/core";
import * as github from "@actions/github";

import * as path from "path";
import { minimatch } from "minimatch";
import * as lib from "../../../lib";
import * as types from "../../../lib/types";
import * as env from "../../../lib/env";
import * as input from "../../../lib/input";
import * as git from "../../../lib/git";
import * as aqua from "../../../aqua";
import * as ciInfo from "../../../ci-info";
import {
  list as listModuleCallers,
  ModuleToCallers,
} from "./list-module-callers";

type TargetConfig = {
  target: string;
  /** A relative path from git_root_dir */
  working_directory: string;
  runs_on: string | string[];
  job_type: string;
  environment?: types.GitHubEnvironment;
  secrets?: types.GitHubSecrets;
  skip_terraform: boolean;
  type?: "module";
};

const getTargetConfigByTarget = (
  targets: Array<types.TargetGroup>,
  wd: string,
  target: string,
  isApply: boolean,
  jobType: types.JobType,
  skipTerraform: boolean,
  type?: "module",
): TargetConfig | undefined => {
  const tg = lib.getTargetFromTargetGroupsByWorkingDir(targets, wd);
  if (tg === undefined) {
    core.warning(`No target group is found for the working directory ${wd}`);
    return undefined;
  }
  const jobConfig = lib.getJobConfig(tg, isApply, jobType);
  let result: TargetConfig;
  if (jobConfig === undefined) {
    result = {
      target: target,
      working_directory: wd,
      runs_on: tg.runs_on ?? "ubuntu-latest",
      environment: tg?.environment,
      secrets: tg.secrets,
      job_type: jobType,
      skip_terraform: skipTerraform,
    };
  } else {
    result = {
      target: target,
      working_directory: wd,
      runs_on: jobConfig.runs_on ?? tg.runs_on ?? "ubuntu-latest",
      environment: jobConfig.environment ?? tg.environment,
      secrets: jobConfig.secrets ?? tg.secrets,
      job_type: jobType,
      skip_terraform: skipTerraform,
    };
  }
  if (type) {
    result.type = type;
  }
  return result;
};

type Payload = {
  pull_request?: PullRequestPayload;
};

type PullRequestPayload = {
  body?: string;
};

type Result = {
  targetConfigs: TargetConfig[];
};

type ModuleData = {
  /**
   * Map of modules and module callers. values call key.
   * key: relative path from git_root_dir to module.
   * value: relative paths from git_root_dir to module caller.
   * */
  moduleCallerMap: Map<string, string[]>;
  /** Relative paths from git_root_dir to modules */
  modules: string[];
};

const createTargetMaps = (
  workingDirs: string[],
  targetGroups: types.TargetGroup[],
  replaceTarget: types.Replace | undefined,
): { wdTargetMap: Map<string, string>; targetWDMap: Map<string, string> } => {
  const wdTargetMap = lib.createWDTargetMap(
    workingDirs,
    targetGroups,
    replaceTarget,
  );
  const targetWDMap = new Map<string, string>();
  for (const [wd, t] of wdTargetMap) {
    targetWDMap.set(t, wd);
  }
  return { wdTargetMap, targetWDMap };
};

const prepareModuleData = (
  moduleCallers: ModuleToCallers | null,
): ModuleData => {
  const moduleCallerMap: Map<string, string[]> = new Map(
    Object.entries(moduleCallers ?? {}),
  );
  /** Relative paths from git_root_dir to modules */
  const modules = [...moduleCallerMap.keys()];
  modules.sort();
  modules.reverse();

  return { moduleCallerMap, modules };
};

const matchesSkipPatterns = (file: string, patterns: string[]): boolean => {
  return patterns.some((p) => minimatch(file, p, { dot: true }));
};

const processChangedFiles = (
  /** Absolute paths to changed files */
  changedFiles: string[],
  moduleData: ModuleData,
  workingDirs: string[],
  wdTargetMap: Map<string, string>,
  skipTerraformFiles: string[],
): {
  changedWorkingDirs: Set<string>;
  changedFilesPerWD: Map<string, string[]>;
} => {
  const changedWorkingDirs = new Set<string>();
  const changedFilesPerWD = new Map<string, string[]>();

  for (const changedFile of changedFiles) {
    if (changedFile == "") {
      continue;
    }
    for (const module of moduleData.modules) {
      const rel = path.relative(module, changedFile);
      if (!rel.startsWith(".." + path.sep)) {
        // changedFile belongs to module, meaning module was changed
        moduleData.moduleCallerMap.get(module)?.forEach((caller) => {
          if (wdTargetMap.has(caller)) {
            changedWorkingDirs.add(caller);
            if (!matchesSkipPatterns(rel, skipTerraformFiles)) {
              const files = changedFilesPerWD.get(caller) ?? [];
              files.push(rel);
              changedFilesPerWD.set(caller, files);
            }
          }
        });
        break;
      }
    }
    for (const workingDir of workingDirs) {
      // changedFile belongs to workingDir, meaning workingDir was changed
      const rel = path.relative(workingDir, changedFile);
      if (!rel.startsWith(".." + path.sep)) {
        changedWorkingDirs.add(workingDir);
        if (!matchesSkipPatterns(rel, skipTerraformFiles)) {
          const files = changedFilesPerWD.get(workingDir) ?? [];
          files.push(rel);
          changedFilesPerWD.set(workingDir, files);
        }
        break;
      }
    }
  }

  return {
    changedWorkingDirs,
    changedFilesPerWD,
  };
};

const addTargetsFromChangedWorkingDirs = (
  changedWorkingDirs: Set<string>,
  wdTargetMap: Map<string, string>,
  terraformTargets: Set<string>,
  tfmigrates: Set<string>,
  targetGroups: types.TargetGroup[],
  isApply: boolean,
  terraformTargetObjs: TargetConfig[],
  changedFilesPerWD: Map<string, string[]>,
  skips: Set<string>,
  moduleWorkingDirs: Set<string>,
): void => {
  for (const changedWorkingDir of changedWorkingDirs) {
    const target = wdTargetMap.get(changedWorkingDir);
    if (target === undefined) {
      core.warning(
        `No target is found for the working directory ${changedWorkingDir}`,
      );
      continue;
    }
    if (terraformTargets.has(target) || tfmigrates.has(target)) {
      continue;
    }
    let skipTerraform = false;
    if (skips.has(target)) {
      skipTerraform = true;
    } else {
      // If WD had changed files but none remain after filtering, all matched skip patterns
      skipTerraform = !changedFilesPerWD.has(changedWorkingDir);
    }
    const type = moduleWorkingDirs.has(changedWorkingDir)
      ? ("module" as const)
      : undefined;
    const obj = getTargetConfigByTarget(
      targetGroups,
      changedWorkingDir,
      target,
      isApply,
      "terraform",
      skipTerraform,
      type,
    );
    if (obj !== undefined) {
      terraformTargets.add(target);
      terraformTargetObjs.push(obj);
    }
  }
};

const validateChangeLimits = async (
  targetConfigs: TargetConfig[],
  maxChangedWorkingDirectories: number,
  githubToken: string,
  executor: aqua.Executor,
): Promise<void> => {
  if (
    maxChangedWorkingDirectories > 0 &&
    targetConfigs.length > maxChangedWorkingDirectories
  ) {
    await executor.exec(
      "github-comment",
      [
        "post",
        "-k",
        "too-many-changed-dirs",
        "-var",
        `max_changed_dirs:${maxChangedWorkingDirectories}`,
      ],
      {
        env: {
          GITHUB_TOKEN: githubToken,
          GH_COMMENT_CONFIG: lib.GitHubCommentConfig,
        },
      },
    );
    throw new Error(
      `Too many working directories are changed (${targetConfigs.length}). Max is ${maxChangedWorkingDirectories}.`,
    );
  }
};

export const run = async (input: Input): Promise<Result> => {
  const config = input.config;
  const isApply = input.isApply;

  // Collect template_dir values from target groups
  const templateDirs = config.target_groups
    .map((tg) => tg.template_dir)
    .filter((dir): dir is string => dir !== undefined);

  // Filter out config files under template directories
  const filteredConfigFiles = input.configFiles.filter((configFile) => {
    const dir = path.dirname(configFile);
    return !templateDirs.some((templateDir) => {
      const rel = path.relative(templateDir, dir);
      return rel === "" || !rel.startsWith("..");
    });
  });

  const workingDirs = listWD(filteredConfigFiles);
  const { wdTargetMap, targetWDMap } = createTargetMaps(
    workingDirs,
    config.target_groups,
    config.replace_target,
  );

  const terraformTargets = new Set<string>();
  const tfmigrates = new Set<string>();
  const terraformTargetObjs = new Array<TargetConfig>();
  const tfmigrateObjs = new Array<TargetConfig>();

  const skips = handleLabels(
    input.labels,
    isApply,
    targetWDMap,
    config.label_prefixes,
    config.target_groups,
    tfmigrateObjs,
    tfmigrates,
  );

  const moduleData = prepareModuleData(input.moduleCallers);
  const { changedWorkingDirs, changedFilesPerWD } = processChangedFiles(
    input.changedFiles,
    moduleData,
    workingDirs,
    wdTargetMap,
    config.skip_terraform_files ?? [],
  );

  const moduleWorkingDirs = input.moduleWorkingDirs ?? new Set<string>();

  addTargetsFromChangedWorkingDirs(
    changedWorkingDirs,
    wdTargetMap,
    terraformTargets,
    tfmigrates,
    config.target_groups,
    isApply,
    terraformTargetObjs,
    changedFilesPerWD,
    skips,
    moduleWorkingDirs,
  );

  // Filter out modules from targetConfigs when in apply mode
  const allTargetConfigs = terraformTargetObjs.concat(tfmigrateObjs);
  const result = {
    targetConfigs: isApply
      ? allTargetConfigs.filter((tc) => tc.type !== "module")
      : allTargetConfigs,
  };

  await validateChangeLimits(
    result.targetConfigs,
    input.maxChangedWorkingDirectories,
    input.githubToken,
    input.executor,
  );

  return result;
};

type Input = {
  config: {
    target_groups: types.TargetGroup[];
    replace_target?: types.Replace;
    label_prefixes?: types.LabelPrefixes;
    skip_terraform_files?: string[];
  };
  isApply: boolean;
  labels: string[];
  /** Absolute paths to changed files */
  changedFiles: string[];
  /** Relative paths from git_root_dir */
  configFiles: string[];
  prBody: string;
  payload: Payload;
  /** Relative path from git_root_dir to module => Relative paths from git_root_dir to module callers */
  moduleCallers: ModuleToCallers | null;
  /** Working directories that have type: module in their tfaction.yaml */
  moduleWorkingDirs?: Set<string>;
  maxChangedWorkingDirectories: number;
  githubToken: string;
  executor: aqua.Executor;
};

/**
 * Returns a list of working directories based on the provided config files.
 * @param configFiles - Relative paths from git_root_dir
 * @returns An array of working directories. Relative paths from git_root_dir
 */
const listWD = (configFiles: string[]): string[] => {
  const workingDirs = new Array<string>();
  for (const configFile of configFiles) {
    if (configFile == "") {
      continue;
    }
    workingDirs.push(path.dirname(configFile));
  }
  workingDirs.sort();
  workingDirs.reverse();
  return workingDirs;
};

const handleLabels = (
  labels: string[],
  isApply: boolean,
  targetWDMap: Map<string, string>,
  labelPrefixes: types.LabelPrefixes | undefined,
  targetGroups: types.TargetGroup[],
  tfmigrateObjs: Array<TargetConfig>,
  tfmigrates: Set<string>,
): Set<string> => {
  const skips = new Set<string>();
  const skipPrefix = labelPrefixes?.skip || "skip:";
  const tfmigratePrefix = labelPrefixes?.tfmigrate || "tfmigrate:";
  for (const label of labels) {
    if (label == "") {
      continue;
    }
    if (label.startsWith(skipPrefix)) {
      skips.add(label.slice(skipPrefix.length));
      continue;
    }
    if (!label.startsWith(tfmigratePrefix)) {
      continue;
    }
    // tfmigrate
    const target = label.slice(tfmigratePrefix.length);
    if (tfmigrates.has(target)) {
      continue;
    }
    tfmigrates.add(target);
    const wd = targetWDMap.get(target);
    if (wd === undefined) {
      throw new Error(`No working directory is found for the target ${target}`);
    }
    const obj = getTargetConfigByTarget(
      targetGroups,
      wd,
      target,
      isApply,
      "tfmigrate",
      false,
    );
    if (obj === undefined) {
      throw new Error(`No target config is found for the target ${target}`);
    }
    tfmigrateObjs.push(obj);
  }
  return skips;
};

export const main = async (executor: aqua.Executor, pr: ciInfo.Result) => {
  const cfg = await lib.getConfig();

  const rootConfigFiles = await git.listWorkingDirFiles(
    cfg.git_root_dir,
    cfg.working_directory_file,
  );
  const moduleConfigFiles = await git.listWorkingDirFiles(
    cfg.git_root_dir,
    cfg.module_file,
  );
  const configFiles = [...rootConfigFiles, ...moduleConfigFiles];

  // Identify module working dirs from moduleConfigFiles (no YAML parsing needed)
  const moduleWorkingDirs = new Set<string>();
  for (const configFile of moduleConfigFiles) {
    if (configFile === "") continue;
    moduleWorkingDirs.add(path.dirname(configFile));
  }

  let moduleCallers: ModuleToCallers | null = null;
  if (cfg.update_local_path_module_caller?.enabled) {
    moduleCallers = await listModuleCallers(
      cfg.git_root_dir,
      configFiles,
      executor,
    );
  }

  const result = await run({
    labels: pr.pr?.data.labels?.map((l) => l.name) ?? [],
    config: cfg,
    isApply: env.isApply,
    changedFiles:
      pr.pr?.files.map((file) => path.join(cfg.git_root_dir, file)) ?? [],
    configFiles,
    moduleWorkingDirs,
    maxChangedWorkingDirectories: cfg.limit_changed_dirs?.working_dirs ?? 0,
    prBody: pr.pr?.data.body ?? "",
    payload: github.context.payload,
    githubToken: input.getRequiredGitHubToken(),
    moduleCallers,
    executor,
  });

  core.info(`result: ${JSON.stringify(result)}`);
  core.setOutput("targets", result.targetConfigs);
};
