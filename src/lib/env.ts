// env.ts responsibility: Read tfaction-specific environment variables from process.env
// - Centralizes environment variable dependencies
// - Prevents typos in environment variable names by avoiding direct process.env references elsewhere
// - env.ts MUST NOT depend on other modules

/**
 * env: {
 *   ...env.dynamicEnvs{
 *     GITHUB_TOKEN: input.githubToken,
 *   },
 * },
 */
export type dynamicEnvs = {
  GITHUB_TOKEN: string;
};

/**
 * Type of keys of env.all and env.record is union, so typo is prevented.
 * Usage:
 *   import * as env from "../../lib/env";
 *   env.all.GITHUB_TOKEN; // Get an environment variable
 *   env.all; // Get all environment variables
 *   env: {
 *     ...env.record("GITHUB_TOKEN", "GH_COMMENT_CONFIG"), // Pass only specific envs to envs
 *   },
 */
const keys = [
  "PATH",
  "GITHUB_TOKEN",
  // GitHub Actions
  "GITHUB_SERVER_URL",
  "GITHUB_REPOSITORY",
  "GITHUB_RUN_ID",
  "GITHUB_WORKSPACE",
  "GITHUB_HEAD_REF",
  "GITHUB_REF_NAME",
  "GITHUB_ACTOR",
  "GITHUB_SHA",
  "GITHUB_STEP_SUMMARY",
  // tfaction
  "TFACTION_DRIFT_ISSUE_NUMBER",
  "TFACTION_DRIFT_ISSUE_STATE",
  "TFACTION_SKIP_TERRAFORM",
  "TFACTION_JOB_TYPE",
  "TFACTION_CONFIG",
  "TFACTION_TARGET",
  "TFACTION_WORKING_DIR",
  "TFACTION_IS_APPLY",
  "TFACTION_TEST_ACTION",
  "TFACTION_TEST_ACTION_TERRAGRUNT",
  "TFACTION_GENERATE_JSON_SCHEMA",
  "TFACTION_MODULE_PATH",
  "TFACTION_MODULE_TEMPLATE_DIR",
  // ci-info
  "CI_INFO_PR_NUMBER",
  "CI_INFO_TEMP_DIR",
  "CI_INFO_HEAD_REF",
  "CI_INFO_PR_AUTHOR",
  // tfmigrate
  "TFMIGRATE_EXEC_PATH",
  // xdg
  "XDG_DATA_HOME",
  // aqua
  "AQUA_ROOT_DIR",
  "AQUA_GLOBAL_CONFIG",
  "AQUA_GITHUB_TOKEN",
  // tests
  "TARGET_CONFIG",
  "GLOBAL_CONFIG",
  "LIST_MODULE_CALLERS",
  // exec only
  "GH_COMMENT_CONFIG",
  "REVIEWDOG_GITHUB_API_TOKEN",
  "TERRAGRUNT_LOG_DISABLE",
] as const;
type env = (typeof keys)[number];

export const record = (...envs: env[]): Partial<Record<env, string>> => {
  return envs.reduce<Partial<Record<env, string>>>((acc, key) => {
    acc[key] = process.env[key] ?? "";
    return acc;
  }, {});
};

export const all: Record<env, string> = keys.reduce<Record<env, string>>(
  (acc, key) => {
    acc[key] = process.env[key] ?? "";
    return acc;
  },
  {} as Record<env, string>,
);

// GitHub Actions (special logic)
export const GITHUB_SERVER_URL =
  process.env.GITHUB_SERVER_URL ?? "https://github.com";

// tfaction (special logic)
export const tfactionSkipTerraform =
  process.env.TFACTION_SKIP_TERRAFORM === "true";
export const tfactionConfig =
  process.env.TFACTION_CONFIG ?? "tfaction-root.yaml";

// Input retrieval functions

export const getIsApply = (): boolean => {
  return (process.env.TFACTION_IS_APPLY ?? "") === "true";
};

export const getGitHubWorkspace = (): string => {
  return process.env.GITHUB_WORKSPACE || process.cwd();
};
