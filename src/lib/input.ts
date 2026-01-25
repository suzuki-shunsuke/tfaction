// input.ts responsibility: Read GitHub Actions inputs
// - Centralizes input retrieval side effects
// - Prevents typos in input names by avoiding direct core.getInput calls elsewhere
// - input.ts MUST NOT depend on other internal modules

import * as core from "@actions/core";

// Common inputs used across multiple actions
export const githubToken = core.getInput("github_token");
export const securefixActionAppId = core.getInput("securefix_action_app_id");
export const securefixActionAppPrivateKey = core.getInput(
  "securefix_action_app_private_key",
);
export const securefixActionServerRepository = core.getInput(
  "securefix_action_server_repository",
);
export const sshKey = core.getInput("ssh_key");

// Action-specific inputs
export const action = core.getInput("action");
export const status = core.getInput("status");
export const issue = core.getInput("issue");
export const modulePath = core.getInput("module_path");
export const version = core.getInput("version");
export const migrationName = core.getInput("migration_name") || "main";
export const prNumber = core.getInput("pr_number");
export const branch = core.getInput("branch");
export const file = core.getInput("file");
export const secrets = core.getInput("secrets");
export const configFiles = core.getInput("config_files");
export const moduleFiles = core.getInput("module_files");

// Helper functions to get inputs with required option
export const getRequiredGitHubToken = (): string => {
  return core.getInput("github_token", { required: true });
};

export const getRequiredStatus = (): string => {
  return core.getInput("status", { required: true });
};

export const getRequiredIssue = (): string => {
  return core.getInput("issue", { required: true });
};

export const getRequiredModulePath = (): string => {
  return core.getInput("module_path", { required: true });
};

export const getRequiredVersion = (): string => {
  return core.getInput("version", { required: true });
};

export const getRequiredConfigFiles = (): string => {
  return core.getInput("config_files", { required: true });
};

export const getRequiredModuleFiles = (): string => {
  return core.getInput("module_files", { required: true });
};
