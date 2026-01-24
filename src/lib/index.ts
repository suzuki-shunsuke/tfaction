import * as fs from "fs";
import * as path from "path";
import * as core from "@actions/core";
import { load } from "js-yaml";
import { z } from "zod";
import * as env from "./env";
import { fileURLToPath } from "node:url";
import { listWorkingDirFiles, getRootDir as getGitRootDir } from "./git";
import {
  RawConfig,
  Config,
  TargetGroup,
  TargetConfig,
  Replace,
  JobType,
  JobConfig,
} from "./types";

export const GitHubActionPath = path.join(
  fileURLToPath(import.meta.url),
  "..",
  "..",
);

export const GitHubCommentConfig = path.join(
  GitHubActionPath,
  "install",
  "github-comment.yaml",
);

export const aquaConfig = path.join(
  GitHubActionPath,
  "install",
  "aqua",
  "aqua.yaml",
);

export const aquaGlobalConfig = env.all.AQUA_GLOBAL_CONFIG
  ? `${env.all.AQUA_GLOBAL_CONFIG}:${aquaConfig}`
  : aquaConfig;

export const getJobType = (): JobType => {
  const jobType = process.env.TFACTION_JOB_TYPE ?? "";
  if (!jobType) {
    throw new Error("environment variable TFACTION_JOB_TYPE is required");
  }
  return JobType.parse(jobType);
};

export const applyConfigDefaults = async (
  raw: z.input<typeof RawConfig>,
  configPath: string,
  workspace: string,
): Promise<Config> => {
  const parsed = RawConfig.parse(raw);
  const configDir = path.dirname(configPath);
  const gitRootDir = await getGitRootDir(configDir);
  return {
    ...parsed,
    git_root_dir: gitRootDir,
    config_path: configPath,
    config_dir: configDir,
    workspace: workspace,
  };
};

export const getConfig = async (): Promise<Config> => {
  const configPath = env.TFACTION_CONFIG;
  const workspace = env.GITHUB_WORKSPACE;
  const raw = RawConfig.parse(load(fs.readFileSync(configPath, "utf8")));
  return await applyConfigDefaults(raw, configPath, workspace);
};

/**
 *
 * @param wds relative paths from git root directory
 * @param config
 * @returns a map of working directory to target name
 */
export const createWDTargetMap = (
  wds: string[],
  targetGroups: TargetGroup[],
  replaceTarget: Replace | undefined,
): Map<string, string> => {
  const m = new Map<string, string>();
  for (const wd of wds) {
    let target = wd;
    for (const tg of targetGroups) {
      const rel = path.relative(tg.working_directory, wd);
      // path.isAbsolute check handles Windows edge case where different drive letters result in absolute path
      if (rel.startsWith("..") || path.isAbsolute(rel)) {
        continue;
      }
      for (const pattern of replaceTarget?.patterns ?? []) {
        target = target.replace(
          new RegExp(pattern.regexp, pattern.flags),
          pattern.replace,
        );
      }
      break;
    }
    m.set(wd, target);
  }
  return m;
};

/**
 *
 * @param targetGroups
 * @param wd a relative path from tfaction-root.yaml
 * @returns
 */
export const getTargetFromTargetGroupsByWorkingDir = (
  targetGroups: Array<TargetGroup>,
  wd: string,
): TargetGroup | undefined => {
  for (const targetConfig of targetGroups) {
    const rel = path.relative(targetConfig.working_directory, wd);
    // path.isAbsolute check handles Windows edge case where different drive letters result in absolute path
    if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
      return targetConfig;
    }
  }
  return undefined;
};

export const readTargetConfig = (p: string): TargetConfig => {
  return TargetConfig.parse(load(fs.readFileSync(p, "utf8")));
};

export const getJobConfig = (
  config: TargetConfig | undefined,
  isApply: boolean,
  jobType: JobType,
): JobConfig | undefined => {
  if (config == undefined) {
    return undefined;
  }
  if (isApply) {
    switch (jobType) {
      case "terraform":
        return config.terraform_apply_config;
      case "tfmigrate":
        return config.tfmigrate_apply_config;
    }
  }
  switch (jobType) {
    case "terraform":
      return config.terraform_plan_config;
    case "tfmigrate":
      return config.tfmigrate_plan_config;
  }
};

export const setValues = (name: string, values: Array<unknown>): void => {
  for (const value of values) {
    if (value != undefined) {
      core.setOutput(name, value);
      return;
    }
  }
};

export const setOutputs = <T extends object>(
  keys: Array<string>,
  objs: Array<T | undefined>,
): Map<string, string> => {
  const outputs = new Map<string, string>();
  for (const key of keys) {
    for (const obj of objs) {
      if (obj != undefined && obj != null && key in obj) {
        const value = (obj as Record<string, unknown>)[key];
        if (value != undefined) {
          outputs.set(key, value as string);
        }
        break;
      }
    }
  }
  return outputs;
};

type HasEnv = {
  env?: Record<string, string>;
};

export const setEnvs = (
  ...objs: Array<HasEnv | undefined>
): Map<string, string> => {
  const envs = new Map<string, string>();
  for (const obj of objs) {
    if (obj?.env) {
      for (const [key, value] of Object.entries(obj.env)) {
        envs.set(key, value);
      }
    }
  }
  return envs;
};

export type Target = {
  target: string;
  workingDir: string;
  group?: TargetGroup;
};

/**
 *
 * @param config
 * @param target
 * @param workingDir a relative path from tfaction-root.yaml
 * @returns
 */
export const getTargetGroup = async (
  config: {
    config_path: string;
    working_directory_file: string;
    target_groups: TargetGroup[];
    replace_target?: Replace | undefined;
  },
  target?: string,
  workingDir?: string,
): Promise<Target> => {
  if (workingDir) {
    const targetConfig = getTargetFromTargetGroupsByWorkingDir(
      config.target_groups,
      workingDir,
    );
    if (target) {
      return {
        target: target,
        workingDir: workingDir,
        group: targetConfig,
      };
    }
    target = workingDir;
    for (const pattern of config.replace_target?.patterns ?? []) {
      target = target.replace(new RegExp(pattern.regexp), pattern.replace);
    }
    return {
      target: target,
      workingDir: workingDir,
      group: targetConfig,
    };
  }

  if (target === undefined) {
    throw new Error(
      "Either TFACTION_TARGET or TFACTION_WORKING_DIR is required",
    );
  }

  const configDir = path.dirname(config.config_path);
  const gitRootDir = await getGitRootDir(configDir);

  const wds: string[] = [];
  const files = await listWorkingDirFiles(
    gitRootDir,
    config.working_directory_file,
  );
  for (const file of files) {
    wds.push(path.dirname(file));
  }
  const m = createWDTargetMap(wds, config.target_groups, config.replace_target);
  for (const [wd, t] of m) {
    if (t === target) {
      workingDir = wd;
      break;
    }
  }
  if (workingDir === undefined) {
    workingDir = target;
  }
  const targetConfig = getTargetFromTargetGroupsByWorkingDir(
    config.target_groups,
    workingDir,
  );
  return {
    target: target,
    workingDir: workingDir,
    group: targetConfig,
  };
};
