// input.ts responsibility: Read GitHub Actions inputs
// - Centralizes input retrieval side effects
// - Prevents typos in input names by avoiding direct core.getInput calls elsewhere
// - input.ts MUST NOT depend on other internal modules

import * as core from "@actions/core";

// Common inputs used across multiple actions
export const githubToken = core.getInput("github_token");
export const githubTokenForGitHubProvider = core.getInput(
  "github_token_for_github_provider",
);

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

// setup, terraform-init, plan, apply
export const secrets = core.getInput("secrets");

// terraform-init, plan, apply
export const awsSecrets = core.getInput("aws_secrets");

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

// output-github-secrets
export const githubSecrets = core.getInput("github_secrets");

// update-drift-issue
export const getRequiredIssue = (): string => {
  return core.getInput("issue", { required: true });
};

export const getRequiredStatus = (): string => {
  return core.getInput("status", { required: true });
};
