import * as core from "@actions/core";
import * as lib from "../lib";

export const main = async () => {
  const config = lib.getConfig();

  if (!config.plan_workflow_name) {
    throw new Error(
      'The setting "plan_workflow_name" is required in tfaction-root.yaml',
    );
  }

  const driftIssueRepo = lib.getDriftIssueRepo(config);
  const driftIssueNumber = process.env.TFACTION_DRIFT_ISSUE_NUMBER;

  // Set outputs
  core.setOutput("base_working_directory", config.base_working_directory);
  core.setOutput("working_directory_file", config.working_directory_file);
  core.setOutput("module_base_directory", config.module_base_directory);
  core.setOutput("module_file", config.module_file);
  core.setOutput("renovate_login", config.renovate_login);
  core.setOutput("draft_pr", config.draft_pr);
  core.setOutput("skip_create_pr", config.skip_create_pr);
  core.setOutput("plan_workflow_name", config.plan_workflow_name);
  core.setOutput("label_prefix_target", config.label_prefixes.target);
  core.setOutput("label_prefix_tfmigrate", config.label_prefixes.tfmigrate);
  core.setOutput("label_prefix_skip", config.label_prefixes.skip);
  core.setOutput("drift_issue_repo_owner", driftIssueRepo.owner);
  core.setOutput("drift_issue_repo_name", driftIssueRepo.name);
  core.setOutput(
    "disable_update_related_pull_requests",
    !(config.update_related_pull_requests?.enabled ?? true),
  );
  core.setOutput(
    "update_local_path_module_caller",
    config.update_local_path_module_caller?.enabled ?? false,
  );
  core.setOutput(
    "aqua_update_checksum_enabled",
    config.aqua?.update_checksum?.enabled ?? false,
  );
  core.setOutput(
    "aqua_update_checksum_prune",
    config.aqua?.update_checksum?.prune ?? false,
  );
  core.setOutput(
    "aqua_update_checksum_skip_push",
    driftIssueNumber
      ? true
      : (config.aqua?.update_checksum?.skip_push ?? false),
  );
  core.setOutput("enable_tflint", config.tflint?.enabled ?? true);
  core.setOutput("enable_trivy", config.trivy?.enabled ?? true);
  core.setOutput("tflint_fix", config.tflint?.fix ?? false);
  core.setOutput("terraform_command", config.terraform_command);
  core.setOutput(
    "follow_up_pr_group_label_prefix",
    config.follow_up_pr_group_label?.prefix ?? "tfaction:follow-up-pr-group/",
  );
  core.setOutput(
    "follow_up_pr_group_label_enabled",
    config.follow_up_pr_group_label?.enabled ?? false,
  );
  core.setOutput(
    "securefix_action_server_repository",
    config.securefix_action?.server_repository ?? "",
  );
  core.setOutput(
    "securefix_action_pull_request_base_branch",
    config.securefix_action?.pull_request?.base_branch ?? "",
  );
  core.setOutput(
    "max_changed_working_dirs",
    config.limit_changed_dirs?.working_dirs ?? 0,
  );
  core.setOutput(
    "max_changed_modules",
    config.limit_changed_dirs?.modules ?? 0,
  );

  // Set environment variables
  core.exportVariable(
    "TFACTION_SKIP_ADDING_AQUA_PACKAGES",
    config.scaffold_working_directory?.skip_adding_aqua_packages ?? true,
  );
};
