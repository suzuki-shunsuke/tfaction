// input.ts responsibility: Read GitHub Actions inputs
// - Centralizes input retrieval side effects
// - Prevents typos in input names by avoiding direct core.getInput calls elsewhere
// - input.ts MUST NOT depend on other internal modules

import * as core from "@actions/core";

// Common inputs used across multiple actions
export const githubToken = core.getInput("github_token");

// Helper functions to get inputs with required option
export const getRequiredGitHubToken = (): string => {
  return core.getInput("github_token", { required: true });
};

export const securefixActionAppId = core.getInput("securefix_action_app_id");
export const securefixActionAppPrivateKey = core.getInput(
  "securefix_action_app_private_key",
);

// all actions
export const action = core.getInput("action");

// export-secrets
export const secrets = core.getInput("secrets");

// generate-config-out
export const branch = core.getInput("branch");
export const file = core.getInput("file");

// release-module
export const getRequiredModulePath = (): string => {
  return core.getInput("module_path", { required: true });
};

export const getRequiredVersion = (): string => {
  return core.getInput("version", { required: true });
};

// scaffold-tfmigrate
export const migrationName = core.getInput("migration_name") || "main";
export const prNumber = core.getInput("pr_number");

// setup
export const sshKey = core.getInput("ssh_key");

// update-drift-issue
export const getRequiredIssue = (): string => {
  return core.getInput("issue", { required: true });
};

export const getRequiredStatus = (): string => {
  return core.getInput("status", { required: true });
};
