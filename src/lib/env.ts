import { JobType } from "./types";
import { aquaConfig } from "./index";

export const path = process.env.PATH ?? "";

// GitHub Actions
export const githubServerUrl = process.env.GITHUB_SERVER_URL ?? "";
export const githubRepository = process.env.GITHUB_REPOSITORY ?? "";
export const githubRunId = process.env.GITHUB_RUN_ID ?? "";
export const githubWorkspace = process.env.GITHUB_WORKSPACE ?? "";
export const githubHeadRef = process.env.GITHUB_HEAD_REF ?? "";
export const githubRefName = process.env.GITHUB_REF_NAME ?? "";
export const githubActor = process.env.GITHUB_ACTOR ?? "";
export const githubSha = process.env.GITHUB_SHA ?? "";
export const githubStepSummary = process.env.GITHUB_STEP_SUMMARY ?? "";
export const githubToken = process.env.GITHUB_TOKEN ?? "";

// tfaction
export const tfactionDriftIssueNumber =
  process.env.TFACTION_DRIFT_ISSUE_NUMBER ?? "";
export const tfactionDriftIssueState =
  process.env.TFACTION_DRIFT_ISSUE_STATE ?? "";
export const tfactionSkipTerraform =
  process.env.TFACTION_SKIP_TERRAFORM === "true";
export const tfactionJobType = process.env.TFACTION_JOB_TYPE ?? "";
export const tfactionConfig =
  process.env.TFACTION_CONFIG ?? "tfaction-root.yaml";
export const tfactionTarget = process.env.TFACTION_TARGET ?? "";
export const tfactionWorkingDir = process.env.TFACTION_WORKING_DIR ?? "";
export const tfactionIsApply = process.env.TFACTION_IS_APPLY ?? "";
export const tfactionTestAction = process.env.TFACTION_TEST_ACTION ?? "";
export const tfactionTestActionTerragrunt =
  process.env.TFACTION_TEST_ACTION_TERRAGRUNT ?? "";
export const tfactionGenerateJsonSchema =
  process.env.TFACTION_GENERATE_JSON_SCHEMA ?? "";
export const tfactionModulePath = process.env.TFACTION_MODULE_PATH ?? "";
export const tfactionModuleTemplateDir =
  process.env.TFACTION_MODULE_TEMPLATE_DIR ?? "";

// ci-info
export const ciInfoPrNumber = process.env.CI_INFO_PR_NUMBER ?? "";
export const ciInfoTempDir = process.env.CI_INFO_TEMP_DIR ?? "";
export const ciInfoHeadRef = process.env.CI_INFO_HEAD_REF ?? "";
export const ciInfoPrAuthor = process.env.CI_INFO_PR_AUTHOR ?? "";

// tools
export const tfmigrateExecPath = process.env.TFMIGRATE_EXEC_PATH ?? "";
export const xdgDataHome = process.env.XDG_DATA_HOME ?? "";

// aqua
export const aquaRootDir = process.env.AQUA_ROOT_DIR ?? "";
export const aquaGlobalConfigEnv = process.env.AQUA_GLOBAL_CONFIG ?? "";
export const aquaGlobalConfig = aquaGlobalConfigEnv
  ? `${aquaGlobalConfigEnv}:${aquaConfig}`
  : aquaConfig;

// tests
export const targetConfig = process.env.TARGET_CONFIG ?? "";
export const globalConfig = process.env.GLOBAL_CONFIG ?? "";
export const listModuleCallers = process.env.LIST_MODULE_CALLERS ?? "";

// Input retrieval functions

export const getJobType = (): JobType => {
  const jobType = process.env.TFACTION_JOB_TYPE ?? "";
  if (!jobType) {
    throw new Error("environment variable TFACTION_JOB_TYPE is required");
  }
  return JobType.parse(jobType);
};

export const getIsApply = (): boolean => {
  return (process.env.TFACTION_IS_APPLY ?? "") === "true";
};

export const getGitHubWorkspace = (): string => {
  return process.env.GITHUB_WORKSPACE || process.cwd();
};
