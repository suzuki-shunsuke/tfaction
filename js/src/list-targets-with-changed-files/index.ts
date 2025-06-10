import * as core from "@actions/core";
import * as github from "@actions/github";
import * as exec from "@actions/exec";
import * as fs from "fs";
import * as path from "path";
import * as lib from "../lib";

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

const getPRBody = (prStr: string, payload: Payload): string => {
  if (payload.pull_request) {
    return payload.pull_request.body || "";
  }
  if (!prStr) {
    return "";
  }
  const pr = JSON.parse(prStr);
  return pr?.body || "";
};

type Result = {
  targetConfigs: TargetConfig[];
  modules: string[];
};

export const run = async (input: Input): Promise<Result> => {
  const config = input.config;
  const isApply = input.isApply;

  const workingDirs = listWD(input.configFiles);

  const wdTargetMap = lib.createWDTargetMap(workingDirs, config);
  const targetWDMap = new Map<string, string>();
  for (const [wd, t] of wdTargetMap) {
    targetWDMap.set(t, wd);
  }

  const terraformTargets = new Set<string>();
  const tfmigrates = new Set<string>();
  const terraformTargetObjs = new Array<TargetConfig>();
  const tfmigrateObjs = new Array<TargetConfig>();

  handleLabels(
    input.labels,
    isApply,
    terraformTargets,
    targetWDMap,
    config,
    terraformTargetObjs,
    tfmigrateObjs,
    tfmigrates,
  );

  const moduleCallerMap: Map<string, string[]> = new Map(
    Object.entries(input.moduleCallers),
  );
  const modules = [...moduleCallerMap.keys()];
  modules.sort();
  modules.reverse();

  const moduleDirs = input.moduleFiles.map((moduleFile) => {
    return path.dirname(moduleFile);
  });
  moduleDirs.sort();
  moduleDirs.reverse();
  const moduleSet = new Set(moduleDirs);

  const changedWorkingDirs = new Set<string>();
  const changedModules = new Set<string>();
  for (const changedFile of input.changedFiles) {
    if (changedFile == "") {
      continue;
    }
    for (const module of modules) {
      if (changedFile.startsWith(module + "/")) {
        moduleCallerMap.get(module)?.forEach((caller) => {
          if (wdTargetMap.has(caller)) {
            changedWorkingDirs.add(caller);
          }
          if (moduleSet.has(caller)) {
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
    for (const module of moduleDirs) {
      if (changedFile.startsWith(module + "/")) {
        changedModules.add(module);
        break;
      }
    }
  }

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

  const ret = {
    targetConfigs: terraformTargetObjs.concat(tfmigrateObjs),
    modules: Array.from(changedModules),
  };

  if (
    input.maxChangedWorkingDirectories > 0 &&
    ret.targetConfigs.length > input.maxChangedWorkingDirectories
  ) {
    await exec.exec(
      "github-comment",
      [
        "post",
        "-k",
        "too-many-changed-dirs",
        "-var",
        `max_changed_dirs:${input.maxChangedWorkingDirectories}`,
      ],
      {
        env: {
          ...process.env,
          GITHUB_TOKEN: input.githubToken,
        },
      },
    );
    throw new Error(
      `Too many working directories are changed (${ret.targetConfigs.length}). Max is ${input.maxChangedWorkingDirectories}.`,
    );
  }
  if (
    input.maxChangedModules > 0 &&
    ret.modules.length > input.maxChangedModules
  ) {
    await exec.exec(
      "github-comment",
      [
        "post",
        "-k",
        "too-many-changed-modules",
        "-var",
        `max_changed_modules:${input.maxChangedModules}`,
      ],
      {
        env: {
          ...process.env,
          GITHUB_TOKEN: input.githubToken,
        },
      },
    );
    throw new Error(`Too many modules are changed ()`);
  }

  return ret;
};

type Input = {
  config: lib.Config;
  isApply: boolean;
  labels: string[];
  changedFiles: string[];
  configFiles: string[];
  moduleFiles: string[];
  pr: string;
  payload: Payload;
  moduleCallers: any;
  maxChangedWorkingDirectories: number;
  maxChangedModules: number;
  githubToken: string;
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
  const prBody = getPRBody(input.pr, input.payload);
  const matchResult = prBody.match(followupTargetCommentRegex);
  return matchResult ? matchResult[1] : "";
};

const handleLabels = (
  labels: string[],
  isApply: boolean,
  terraformTargets: Set<string>,
  targetWDMap: Map<string, string>,
  config: lib.Config,
  terraformTargetObjs: Array<TargetConfig>,
  tfmigrateObjs: Array<TargetConfig>,
  tfmigrates: Set<string>,
) => {
  const skips = new Set<string>();
  const targetPrefix = config?.label_prefixes?.target || "target:";
  const skipPrefix = config?.label_prefixes?.skip || "skip:";
  const tfmigratePrefix = config?.label_prefixes?.tfmigrate || "tfmigrate:";
  for (const label of labels) {
    if (label == "") {
      continue;
    }
    if (label.startsWith(targetPrefix)) {
      const target = label.slice(targetPrefix.length);
      if (!terraformTargets.has(target)) {
        terraformTargets.add(target);
        const wd = targetWDMap.get(target);
        if (wd === undefined) {
          throw new Error(
            `No working directory is found for the target ${target}`,
          );
        }
        const tg = lib.getTargetFromTargetGroupsByWorkingDir(
          config.target_groups,
          wd,
        );
        const obj = getTargetConfigByTarget(
          config.target_groups,
          wd,
          target,
          isApply,
          "terraform",
        );
        if (obj === undefined) {
          throw new Error(`No target config is found for the target ${target}`);
        }
        terraformTargetObjs.push(obj);
      }
      continue;
    }
    if (label.startsWith(tfmigratePrefix)) {
      const target = label.slice(tfmigratePrefix.length);
      if (!tfmigrates.has(target)) {
        tfmigrates.add(target);
        const wd = targetWDMap.get(target);
        if (wd === undefined) {
          throw new Error(
            `No working directory is found for the target ${target}`,
          );
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
      continue;
    }
    if (label.startsWith(skipPrefix)) {
      skips.add(label.slice(skipPrefix.length));
      continue;
    }
  }
};

export const main = async () => {
  // The path to ci-info's pr.json.
  const prPath = core.getInput("pull_request");
  const pr = prPath ? fs.readFileSync(prPath, "utf8") : "";

  const result = await run({
    labels: fs.readFileSync(core.getInput("labels"), "utf8").split("\n"),
    config: lib.getConfig(),
    isApply: lib.getIsApply(),
    changedFiles: fs
      .readFileSync(core.getInput("changed_files"), "utf8")
      .split("\n"),
    configFiles: fs
      .readFileSync(core.getInput("config_files"), "utf8")
      .split("\n"),
    moduleFiles: fs
      .readFileSync(core.getInput("module_files"), "utf8")
      .split("\n"),
    maxChangedWorkingDirectories: parseInt(
      core.getInput("max_changed_working_dirs"),
    ),
    maxChangedModules: parseInt(core.getInput("max_changed_modules")),
    pr,
    payload: github.context.payload,
    /*
    {
      // caller is a directory where uses the module
      module1: [caller1, caller2],
    }
    */
    moduleCallers: JSON.parse(core.getInput("module_callers") || "{}"),
  });

  core.info(`result: ${JSON.stringify(result)}`);
  core.setOutput("targets", result.targetConfigs);
  core.setOutput("modules", result.modules);
};
