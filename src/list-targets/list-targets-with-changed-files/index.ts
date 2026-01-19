import * as core from "@actions/core";
import * as github from "@actions/github";

import * as path from "path";
import * as lib from "../../lib";
import * as input from "../../lib/input";
import * as aqua from "../../aqua";
import * as ciInfo from "../../ci-info";
import { list as listModuleCallers } from "./list-module-callers";

type TargetConfig = {
  target: string;
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

const getPRBody = (prBody: string, payload: Payload): string => {
  if (payload.pull_request) {
    return payload.pull_request.body || "";
  }
  return prBody;
};

type Result = {
  targetConfigs: TargetConfig[];
  modules: string[];
};

type ModuleData = {
  moduleCallerMap: Map<string, string[]>;
  modules: string[];
  moduleDirs: string[];
  moduleSet: Set<string>;
};

const createTargetMaps = (
  workingDirs: string[],
  config: lib.Config,
): { wdTargetMap: Map<string, string>; targetWDMap: Map<string, string> } => {
  const wdTargetMap = lib.createWDTargetMap(workingDirs, config);
  const targetWDMap = new Map<string, string>();
  for (const [wd, t] of wdTargetMap) {
    targetWDMap.set(t, wd);
  }
  return { wdTargetMap, targetWDMap };
};

const prepareModuleData = (
  moduleCallers: Record<string, string[]> | null,
  moduleFiles: string[],
): ModuleData => {
  const moduleCallerMap: Map<string, string[]> = new Map(
    Object.entries(moduleCallers ?? {}),
  );
  const modules = [...moduleCallerMap.keys()];
  modules.sort();
  modules.reverse();

  const moduleDirs = moduleFiles.map((moduleFile) => {
    return path.dirname(moduleFile);
  });
  moduleDirs.sort();
  moduleDirs.reverse();
  const moduleSet = new Set(moduleDirs);

  return { moduleCallerMap, modules, moduleDirs, moduleSet };
};

const processChangedFiles = (
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
      if (changedFile.startsWith(module + "/")) {
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
      if (changedFile.startsWith(workingDir + "/")) {
        changedWorkingDirs.add(workingDir);
        break;
      }
    }
    for (const module of moduleData.moduleDirs) {
      if (changedFile.startsWith(module + "/")) {
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
  config: lib.Config,
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
    if (!terraformTargets.has(target) && !tfmigrates.has(target)) {
      const obj = getTargetConfigByTarget(
        config.target_groups,
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
  }
};

const addFollowupTarget = (
  input: Input,
  tfmigrates: Set<string>,
  terraformTargets: Set<string>,
  targetWDMap: Map<string, string>,
  config: lib.Config,
  isApply: boolean,
  terraformTargetObjs: TargetConfig[],
): void => {
  const followupTarget = getFollowupTarget(input);

  if (
    followupTarget &&
    !tfmigrates.has(followupTarget) &&
    !terraformTargets.has(followupTarget)
  ) {
    const wd = targetWDMap.get(followupTarget);
    if (wd === undefined) {
      throw new Error(
        `No working directory is found for the target ${followupTarget}`,
      );
    }
    const obj = getTargetConfigByTarget(
      config.target_groups,
      wd,
      followupTarget,
      isApply,
      "terraform",
    );
    if (obj !== undefined) {
      terraformTargets.add(followupTarget);
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
  const { wdTargetMap, targetWDMap } = createTargetMaps(workingDirs, config);

  const terraformTargets = new Set<string>();
  const tfmigrates = new Set<string>();
  const terraformTargetObjs = new Array<TargetConfig>();
  const tfmigrateObjs = new Array<TargetConfig>();

  handleLabels(
    input.labels,
    isApply,
    targetWDMap,
    config,
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
    config,
    isApply,
    terraformTargetObjs,
  );

  addFollowupTarget(
    input,
    tfmigrates,
    terraformTargets,
    targetWDMap,
    config,
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
  config: lib.Config;
  isApply: boolean;
  labels: string[];
  changedFiles: string[];
  configFiles: string[];
  moduleFiles: string[];
  prBody: string;
  payload: Payload;
  moduleCallers: Record<string, string[]> | null;
  maxChangedWorkingDirectories: number;
  maxChangedModules: number;
  githubToken: string;
  executor: aqua.Executor;
};

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

const getFollowupTarget = (input: Input): string => {
  // Expected followupPRBody include the line:
  // <!-- tfaction follow up pr target=foo -->
  const followupTargetCommentRegex = new RegExp(
    /<!-- tfaction follow up pr target=([^\s]+).*-->/,
    "s",
  );
  const prBody = getPRBody(input.prBody, input.payload);
  const matchResult = prBody.match(followupTargetCommentRegex);
  return matchResult ? matchResult[1] : "";
};

const handleLabels = (
  labels: string[],
  isApply: boolean,
  targetWDMap: Map<string, string>,
  config: lib.Config,
  tfmigrateObjs: Array<TargetConfig>,
  tfmigrates: Set<string>,
) => {
  const skips = new Set<string>();
  const skipPrefix = config?.label_prefixes?.skip || "skip:";
  const tfmigratePrefix = config?.label_prefixes?.tfmigrate || "tfmigrate:";
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
      config.target_groups,
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
    cfg.config_dir,
    cfg.working_directory_file,
  );
  const modules = await lib.listWorkingDirFiles(
    cfg.git_root_dir,
    cfg.config_dir,
    cfg.module_file,
  );

  let moduleCallers: Record<string, string[]> | null = null;
  if (cfg.update_local_path_module_caller?.enabled) {
    moduleCallers = await listModuleCallers(
      cfg.config_dir,
      configFiles,
      modules,
      executor,
    );
  }

  const result = await run({
    labels: pr.pr?.data.labels?.map((l) => l.name) ?? [],
    config: cfg,
    isApply: lib.getIsApply(),
    changedFiles: pr.pr?.files ?? [],
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
