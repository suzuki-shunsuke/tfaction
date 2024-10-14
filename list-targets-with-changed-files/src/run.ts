import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";
import * as path from "path";
import * as lib from "lib";

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
): TargetConfig => {
  const tg = lib.getTargetFromTargetGroupsByWorkingDir(targets, wd);
  if (tg === undefined) {
    throw new Error(`No target group is found for the working directory ${wd}`);
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

export const run = (input: Input): TargetConfig[] => {
  const config = input.config;
  const isApply = input.isApply;

  const configWorkingDirMap = new Map();
  const configTargetMap = new Map();
  for (const target of config.target_groups) {
    configWorkingDirMap.set(target.working_directory, target);
    if (target.target !== undefined) {
      configTargetMap.set(target.target, target);
    }
  }

  const labels = input.labels;
  const changedFiles = input.changedFiles;
  const configFiles = input.configFiles;

  const workingDirs = new Array<string>();
  for (const configFile of configFiles) {
    if (configFile == "") {
      continue;
    }
    workingDirs.push(path.dirname(configFile));
  }
  workingDirs.sort();
  workingDirs.reverse();

  const wdTargetMap = lib.createWDTargetMap(workingDirs, config);
  const targetWDMap = new Map<string, string>();
  for (const [wd, t] of wdTargetMap) {
    targetWDMap.set(t, wd);
  }

  // Expected followupPRBody include the line:
  // <!-- tfaction follow up pr target=foo -->
  const followupTargetCommentRegex = new RegExp(
    /<!-- tfaction follow up pr target=([^\s]+).*-->/,
    "s",
  );
  const prBody = getPRBody(input.pr, input.payload);
  const matchResult = prBody.match(followupTargetCommentRegex);
  const followupTarget = matchResult ? matchResult[1] : "";

  const terraformTargets = new Set<string>();
  const tfmigrates = new Set<string>();
  const skips = new Set<string>();
  const terraformTargetObjs = new Array<TargetConfig>();
  const tfmigrateObjs = new Array<TargetConfig>();

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
          throw new Error(`No working directory is found for the target ${target}`);
        }
        const tg = lib.getTargetFromTargetGroupsByWorkingDir(config.target_groups, wd);
        terraformTargetObjs.push(
          getTargetConfigByTarget(
            config.target_groups,
            wd,
            target,
            isApply,
            "terraform",
          ),
        );
      }
      continue;
    }
    if (label.startsWith(tfmigratePrefix)) {
      const target = label.slice(tfmigratePrefix.length);
      if (!tfmigrates.has(target)) {
        tfmigrates.add(target);
        const wd = targetWDMap.get(target);
        if (wd === undefined) {
          throw new Error(`No working directory is found for the target ${target}`);
        }
        tfmigrateObjs.push(
          getTargetConfigByTarget(
            config.target_groups,
            wd,
            target,
            isApply,
            "tfmigrate",
          ),
        );
      }
      continue;
    }
    if (label.startsWith(skipPrefix)) {
      skips.add(label.slice(skipPrefix.length));
      continue;
    }
  }

  const moduleCallerMap = input.module_callers;
  const changedWorkingDirs = new Set<string>();
  for (const changedFile of changedFiles) {
    if (changedFile == "") {
      continue;
    }
    const dir = path.dirname(changedFile);
    const moduleCallers: string[] = moduleCallerMap[dir] || [];
    for (const caller of moduleCallers) {
      changedWorkingDirs.add(caller);
    }
    for (const workingDir of workingDirs) {
      if (changedFile.startsWith(workingDir + "/")) {
        changedWorkingDirs.add(workingDir);
        break;
      }
    }
  }

  for (const changedWorkingDir of changedWorkingDirs) {
    const target = wdTargetMap.get(changedWorkingDir);
    if (target === undefined) {
      throw new Error(`No target is found for the working directory ${changedWorkingDir}`);
    }
    if (
      !terraformTargets.has(target) &&
      !tfmigrates.has(target)
    ) {
      terraformTargets.add(target);
      terraformTargetObjs.push(
        getTargetConfigByTarget(
          config.target_groups,
          changedWorkingDir,
          target,
          isApply,
          "terraform",
        ),
      );
    }
  }

  if (
    followupTarget &&
    !tfmigrates.has(followupTarget) &&
    !terraformTargets.has(followupTarget)
  ) {
    const wd = targetWDMap.get(followupTarget);
    if (wd === undefined) {
      throw new Error(`No working directory is found for the target ${followupTarget}`);
    }
    terraformTargets.add(followupTarget);
    terraformTargetObjs.push(
      getTargetConfigByTarget(
        config.target_groups,
        wd,
        followupTarget,
        isApply,
        "terraform",
      ),
    );
  }

  return terraformTargetObjs.concat(tfmigrateObjs);
};

type Input = {
  config: lib.Config;
  isApply: boolean;
  labels: string[];
  changedFiles: string[];
  configFiles: string[];
  pr: string;
  payload: Payload;
  module_callers: Record<string, string[]>;
};

export const main = () => {
  // The path to ci-info's pr.json.
  const prPath = core.getInput("pull_request");
  const pr = prPath ? fs.readFileSync(prPath, "utf8") : "";

  const targetConfigs = run({
    labels: fs.readFileSync(core.getInput("labels"), "utf8").split("\n"),
    config: lib.getConfig(),
    isApply: lib.getIsApply(),
    changedFiles: fs
      .readFileSync(core.getInput("changed_files"), "utf8")
      .split("\n"),
    configFiles: fs
      .readFileSync(core.getInput("config_files"), "utf8")
      .split("\n"),
    pr,
    payload: github.context.payload,
    module_callers: JSON.parse(
      core.getInput("module_callers") || "{}",
    ) as Record<string, string[]>,
  });

  core.info(`targets: ${JSON.stringify(targetConfigs)}`);
  core.setOutput("targets", targetConfigs);
};
