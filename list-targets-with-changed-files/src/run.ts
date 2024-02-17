import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";
import * as path from "path";
import * as lib from "lib";

type TargetConfig = {
  target: string;
  runs_on: string;
  job_type: string;
  environment?: lib.GitHubEnvironment;
  secrets?: lib.GitHubSecrets;
};

const getTargetConfigByTarget = (
  targets: Array<lib.TargetGroup>,
  target: string,
  isApply: boolean,
  jobType: lib.JobType,
): TargetConfig => {
  for (const t of targets) {
    if (!target.startsWith(t.target)) {
      continue;
    }
    const jobConfig = lib.getJobConfig(t, isApply, jobType);
    if (jobConfig === undefined) {
      return {
        target: target,
        runs_on: t.runs_on ? t.runs_on : "ubuntu-latest",
        environment: t?.environment,
        secrets: t.secrets,
        job_type: jobType,
      };
    }
    return {
      target: target,
      runs_on: jobConfig.runs_on
        ? jobConfig.runs_on
        : t.runs_on
          ? t.runs_on
          : "ubuntu-latest",
      environment: jobConfig.environment
        ? jobConfig.environment
        : t?.environment,
      secrets: jobConfig.secrets ? jobConfig.secrets : t.secrets,
      job_type: jobType,
    };
  }
  throw new Error("target is invalid");
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
  for (let i = 0; i < config.target_groups.length; i++) {
    const target = config.target_groups[i];
    configWorkingDirMap.set(target.working_directory, target);
    configTargetMap.set(target.target, target);
  }

  const labels = input.labels;
  const changedFiles = input.changedFiles;
  const configFiles = input.configFiles;
  const workingDirs = new Set<string>();
  for (let i = 0; i < configFiles.length; i++) {
    const configFile = configFiles[i];
    if (configFile == "") {
      continue;
    }
    workingDirs.add(path.dirname(configFile));
  }

  // <!-- tfaction follow up pr target=foo -->
  let followupTarget = "";
  const followupPRBodyPrefix = "<!-- tfaction follow up pr target=";
  const prBody = getPRBody(input.pr, input.payload);
  if (prBody.startsWith(followupPRBodyPrefix)) {
    followupTarget = prBody
      .split("\n")[0]
      .slice(followupPRBodyPrefix.length, -" -->".length);
  }

  const terraformTargets = new Set<string>();
  const tfmigrates = new Set<string>();
  const skips = new Set<string>();
  const terraformTargetObjs = new Array<TargetConfig>();
  const tfmigrateObjs = new Array<TargetConfig>();

  const targetPrefix = config?.label_prefixes?.target || "target:";
  const skipPrefix = config?.label_prefixes?.skip || "skip:";
  const tfmigratePrefix = config?.label_prefixes?.tfmigrate || "tfmigrate:";

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    if (label == "") {
      continue;
    }
    if (label.startsWith(targetPrefix)) {
      const target = label.slice(targetPrefix.length);
      if (!terraformTargets.has(target)) {
        terraformTargets.add(target);
        terraformTargetObjs.push(
          getTargetConfigByTarget(
            config.target_groups,
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
        tfmigrateObjs.push(
          getTargetConfigByTarget(
            config.target_groups,
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
  for (let i = 0; i < changedFiles.length; i++) {
    const changedFile = changedFiles[i];
    if (changedFile == "") {
      continue;
    }
    const dir = path.dirname(changedFile);
    for (let workingDir of workingDirs) {
      if (changedFile.startsWith(workingDir + "/")) {
        changedWorkingDirs.add(workingDir);
      }
      const moduleCallers: string[] = moduleCallerMap[dir] || [];
      for (const caller of moduleCallers) {
        changedWorkingDirs.add(caller);
      }
    }
  }

  for (const changedWorkingDir of changedWorkingDirs) {
    for (let i = 0; i < config.target_groups.length; i++) {
      const target = config.target_groups[i];
      if (changedWorkingDir.startsWith(target.working_directory)) {
        const changedTarget = changedWorkingDir.replace(
          target.working_directory,
          target.target,
        );
        if (
          !terraformTargets.has(changedTarget) &&
          !tfmigrates.has(changedTarget)
        ) {
          terraformTargets.add(changedTarget);
          terraformTargetObjs.push(
            getTargetConfigByTarget(
              config.target_groups,
              changedTarget,
              isApply,
              "terraform",
            ),
          );
        }
        break;
      }
    }
  }

  if (
    followupTarget &&
    !tfmigrates.has(followupTarget) &&
    !terraformTargets.has(followupTarget)
  ) {
    terraformTargets.add(followupTarget);
    terraformTargetObjs.push(
      getTargetConfigByTarget(
        config.target_groups,
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
    module_callers: JSON.parse(core.getInput("module_callers") || "{}") as Record<string, string[]>,
  });

  core.info(`targets: ${JSON.stringify(targetConfigs)}`);
  core.setOutput("targets", targetConfigs);
};
