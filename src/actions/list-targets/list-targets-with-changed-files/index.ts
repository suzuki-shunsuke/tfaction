import * as core from "@actions/core";
import * as github from "@actions/github";

import * as path from "path";
import * as lib from "../../../lib";
import * as env from "../../../lib/env";
import * as input from "../../../lib/input";
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
  environment?: lib.GitHubEnvironment;
  secrets?: lib.GitHubSecrets;
};

const getTargetConfigByTarget = (
  targets: Array<lib.TargetGroup>,
  wd: string,
  target: string,
  isApply: boolean,
  jobType: lib.JobType,
): TargetConfig | undefined => {
  const tg = lib.getTargetFromTargetGroupsByWorkingDir(targets, wd);
  if (tg === undefined) {
    core.warning(`No target group is found for the working directory ${wd}`);
    return undefined;
  }
  const jobConfig = lib.getJobConfig(tg, isApply, jobType);
  if (jobConfig === undefined) {
    return {
      target: target,
      working_directory: wd,
      runs_on: tg.runs_on ?? "ubuntu-latest",
      environment: tg?.environment,
      secrets: tg.secrets,
      job_type: jobType,
    };
  }
  return {
    target: target,
    working_directory: wd,
    runs_on: jobConfig.runs_on ?? tg.runs_on ?? "ubuntu-latest",
    environment: jobConfig.environment ?? tg.environment,
    secrets: jobConfig.secrets ?? tg.secrets,
    job_type: jobType,
  };
};

type Payload = {
  pull_request?: PullRequestPayload;
};

type PullRequestPayload = {
  body?: string;
};

type Result = {
  targetConfigs: TargetConfig[];
  /** Relative file paths from git_root_dir */
  modules: string[];
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
  /** Relative paths from git_root_dir to modules */
  moduleDirs: string[];
  /** Relative paths from git_root_dir to modules */
  moduleSet: Set<string>;
};

const createTargetMaps = (
  workingDirs: string[],
  targetGroups: lib.TargetGroup[],
  replaceTarget: lib.Replace | undefined,
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
  moduleFiles: string[],
): ModuleData => {
  const moduleCallerMap: Map<string, string[]> = new Map(
    Object.entries(moduleCallers ?? {}),
  );
  /** Relative paths from git_root_dir to modules */
  const modules = [...moduleCallerMap.keys()];
  modules.sort();
  modules.reverse();

  /** Relative paths from git_root_dir to modules */
  const moduleDirs = moduleFiles.map((moduleFile) => {
    return path.dirname(moduleFile);
  });
  moduleDirs.sort();
  moduleDirs.reverse();
  const moduleSet = new Set(moduleDirs);

  return { moduleCallerMap, modules, moduleDirs, moduleSet };
};

const processChangedFiles = (
  /** Absolute paths to changed files */
  changedFiles: string[],
  moduleData: ModuleData,
  workingDirs: string[],
  wdTargetMap: Map<string, string>,
): { changedWorkingDirs: Set<string>; changedModules: Set<string> } => {
  const changedWorkingDirs = new Set<string>();
  const changedModules = new Set<string>();

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
          }
          if (moduleData.moduleSet.has(caller)) {
            changedModules.add(caller);
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
        break;
      }
    }
    for (const module of moduleData.moduleDirs) {
      const rel = path.relative(module, changedFile);
      if (!rel.startsWith(".." + path.sep)) {
        changedModules.add(module);
        break;
      }
    }
  }

  return { changedWorkingDirs, changedModules };
};

const addTargetsFromChangedWorkingDirs = (
  changedWorkingDirs: Set<string>,
  wdTargetMap: Map<string, string>,
  terraformTargets: Set<string>,
  tfmigrates: Set<string>,
  targetGroups: lib.TargetGroup[],
  isApply: boolean,
  terraformTargetObjs: TargetConfig[],
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
    const obj = getTargetConfigByTarget(
      targetGroups,
      changedWorkingDir,
      target,
      isApply,
      "terraform",
    );
    if (obj !== undefined) {
      terraformTargets.add(target);
      terraformTargetObjs.push(obj);
    }
  }
};

const validateChangeLimits = async (
  targetConfigs: TargetConfig[],
  modules: string[],
  maxChangedWorkingDirectories: number,
  maxChangedModules: number,
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
  if (maxChangedModules > 0 && modules.length > maxChangedModules) {
    await executor.exec(
      "github-comment",
      [
        "post",
        "-k",
        "too-many-changed-modules",
        "-var",
        `max_changed_modules:${maxChangedModules}`,
      ],
      {
        env: {
          GITHUB_TOKEN: githubToken,
          GH_COMMENT_CONFIG: lib.GitHubCommentConfig,
        },
      },
    );
    throw new Error(
      `Too many modules are changed (${modules.length}). Max is ${maxChangedModules}.`,
    );
  }
};

export const run = async (input: Input): Promise<Result> => {
  const config = input.config;
  const isApply = input.isApply;

  const workingDirs = listWD(input.configFiles);
  const { wdTargetMap, targetWDMap } = createTargetMaps(
    workingDirs,
    config.target_groups,
    config.replace_target,
  );

  const terraformTargets = new Set<string>();
  const tfmigrates = new Set<string>();
  const terraformTargetObjs = new Array<TargetConfig>();
  const tfmigrateObjs = new Array<TargetConfig>();

  handleLabels(
    input.labels,
    isApply,
    targetWDMap,
    config.label_prefixes,
    config.target_groups,
    tfmigrateObjs,
    tfmigrates,
  );

  const moduleData = prepareModuleData(input.moduleCallers, input.moduleFiles);
  const { changedWorkingDirs, changedModules } = processChangedFiles(
    input.changedFiles,
    moduleData,
    workingDirs,
    wdTargetMap,
  );

  addTargetsFromChangedWorkingDirs(
    changedWorkingDirs,
    wdTargetMap,
    terraformTargets,
    tfmigrates,
    config.target_groups,
    isApply,
    terraformTargetObjs,
  );

  const result = {
    targetConfigs: terraformTargetObjs.concat(tfmigrateObjs),
    modules: Array.from(changedModules),
  };

  await validateChangeLimits(
    result.targetConfigs,
    result.modules,
    input.maxChangedWorkingDirectories,
    input.maxChangedModules,
    input.githubToken,
    input.executor,
  );

  return result;
};

type Input = {
  config: {
    target_groups: lib.TargetGroup[];
    replace_target?: lib.Replace;
    label_prefixes?: lib.LabelPrefixes;
  };
  isApply: boolean;
  labels: string[];
  /** Absolute paths to changed files */
  changedFiles: string[];
  /** Relative paths from git_root_dir */
  configFiles: string[];
  /** Relative paths from git_root_dir */
  moduleFiles: string[];
  prBody: string;
  payload: Payload;
  /** Relative path from git_root_dir to module => Relative paths from git_root_dir to module callers */
  moduleCallers: ModuleToCallers | null;
  maxChangedWorkingDirectories: number;
  maxChangedModules: number;
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
  labelPrefixes: lib.LabelPrefixes | undefined,
  targetGroups: lib.TargetGroup[],
  tfmigrateObjs: Array<TargetConfig>,
  tfmigrates: Set<string>,
) => {
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
    );
    if (obj === undefined) {
      throw new Error(`No target config is found for the target ${target}`);
    }
    tfmigrateObjs.push(obj);
  }
};

export const main = async (executor: aqua.Executor, pr: ciInfo.Result) => {
  const cfg = await lib.getConfig();

  const configFiles = await lib.listWorkingDirFiles(
    cfg.git_root_dir,
    cfg.working_directory_file,
  );
  const modules = await lib.listWorkingDirFiles(
    cfg.git_root_dir,
    cfg.module_file,
  );

  let moduleCallers: ModuleToCallers | null = null;
  if (cfg.update_local_path_module_caller?.enabled) {
    moduleCallers = await listModuleCallers(
      cfg.git_root_dir,
      configFiles,
      modules,
      executor,
    );
  }

  const result = await run({
    labels: pr.pr?.data.labels?.map((l) => l.name) ?? [],
    config: cfg,
    isApply: env.getIsApply(),
    changedFiles:
      pr.pr?.files.map((file) => path.join(cfg.git_root_dir, file)) ?? [],
    configFiles,
    moduleFiles: modules,
    maxChangedWorkingDirectories: cfg.limit_changed_dirs?.working_dirs ?? 0,
    maxChangedModules: cfg.limit_changed_dirs?.modules ?? 0,
    prBody: pr.pr?.data.body ?? "",
    payload: github.context.payload,
    githubToken: input.getRequiredGitHubToken(),
    /*
    {
      // caller is a directory where uses the module
      module1: [caller1, caller2],
    }
    */
    moduleCallers,
    executor,
  });

  core.info(`result: ${JSON.stringify(result)}`);
  core.setOutput("targets", result.targetConfigs);
  core.setOutput("modules", result.modules);
};
