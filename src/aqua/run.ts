import { join } from "path";
import type { dynamicEnvs } from "../lib/env";

const _varKeys = ["tfaction_target", "pr_url"] as const;
export type varKey = (typeof _varKeys)[number];

export type Comment = {
  token: string;
  key?:
    | "conftest"
    | "terraform-validate"
    | "tfmigrate-plan"
    | "tfmigrate-apply"
    | "drift-apply";
  vars?: Partial<Record<varKey, string>>;
  org?: string;
  repo?: string;
  pr?: string;
};

export type Args = {
  command: string;
  args?: string[];
};

export const getOS = (p: string): string => {
  switch (p) {
    case "darwin":
      return "darwin";
    case "linux":
      return "linux";
    case "win32":
      return "windows";
    default:
      throw new Error(`Unsupported OS: ${p}`);
  }
};

export const getArch = (architecture: string): string => {
  switch (architecture) {
    case "x64":
      return "amd64";
    case "arm64":
      return "arm64";
    default:
      throw new Error(`Unsupported architecture: ${architecture}`);
  }
};

export const getInstallPath = (
  os: string,
  aquaRoot: string,
  xdgDataHome: string,
  homeDir: string,
): string => {
  if (os === "windows") {
    const base = aquaRoot || join(homeDir, "AppData", "Local", "aquaproj-aqua");
    return join(base, "bin", "aqua.exe");
  }
  const xdgDataHomeVal = xdgDataHome || join(homeDir, ".local", "share");
  const base = aquaRoot || join(xdgDataHomeVal, "aquaproj-aqua");
  return join(base, "bin", "aqua");
};

export type ExecOptionsForArgs = {
  comment?: Comment;
};

export const buildArgs = (
  command: string,
  args?: string[],
  options?: ExecOptionsForArgs,
): Args => {
  if (!options?.comment) {
    return {
      command,
      args,
    };
  }
  const newArgs = ["exec"];
  if (options.comment.org) {
    newArgs.push("-org", options.comment.org);
  }
  if (options.comment.repo) {
    newArgs.push("-repo", options.comment.repo);
  }
  if (options.comment.pr) {
    newArgs.push("-pr", options.comment.pr);
  }
  if (options.comment.vars) {
    for (const key of _varKeys) {
      if (options.comment.vars[key]) {
        newArgs.push("-var", `${key}:${options.comment.vars[key]}`);
      }
    }
  }
  if (options.comment.key) {
    newArgs.push("-k", options.comment.key);
  }
  newArgs.push("--", command);
  newArgs.push(...(args ?? []));
  return {
    command: "github-comment",
    args: newArgs,
  };
};

export type EnvDeps = {
  processEnv: Record<string, string | undefined>;
  path: string;
  aquaGlobalConfig: string;
  gitHubCommentConfig: string;
};

export type ExecOptionsForEnv = {
  env?: dynamicEnvs;
  comment?: Comment;
};

export const buildEnv = (
  deps: EnvDeps,
  installDir: string,
  githubToken?: string,
  options?: ExecOptionsForEnv,
): Record<string, string | undefined> => {
  const dynamicEnv: dynamicEnvs = {
    AQUA_GLOBAL_CONFIG: deps.aquaGlobalConfig,
  };
  if (installDir) {
    dynamicEnv.PATH = `${deps.path}:${installDir}`;
  }
  if (githubToken) {
    dynamicEnv.AQUA_GITHUB_TOKEN = githubToken;
  }
  if (options?.comment) {
    dynamicEnv.GITHUB_TOKEN = options.comment.token;
    dynamicEnv.GH_COMMENT_CONFIG = deps.gitHubCommentConfig;
  }

  return {
    ...deps.processEnv,
    ...options?.env,
    ...dynamicEnv,
  };
};
