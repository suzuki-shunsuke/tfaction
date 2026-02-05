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

// For all actions
export const action = core.getInput("action");

// For setup
export const sshKey = core.getInput("ssh_key");

// For scaffold-tfmigrate
export const migrationName = core.getInput("migration_name") || "main";
export const prNumber = core.getInput("pr_number");

// For generate-config-out
export const branch = core.getInput("branch");
export const file = core.getInput("file");

// For export-secrets
export const secrets = core.getInput("secrets");

// Helper functions to get inputs with required option
export const getRequiredGitHubToken = (): string => {
  return core.getInput("github_token", { required: true });
};

export const getRequiredIssue = (): string => {
  // update-drift-issue
  return core.getInput("issue", { required: true });
};
