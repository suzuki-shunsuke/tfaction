import * as core from "@actions/core";
import * as lib from "../../lib";
import * as drift from "../../lib/drift";
import * as env from "../../lib/env";
import { run } from "./run";

export const main = async () => {
  const config = await lib.getConfig();

  if (!config.plan_workflow_name) {
    throw new Error(
      'The setting "plan_workflow_name" is required in tfaction-root.yaml',
    );
  }

  const driftIssueRepo = drift.getDriftIssueRepo(config);
  const driftIssueNumber = env.all.TFACTION_DRIFT_ISSUE_NUMBER;

  const result = run({
    config,
    driftIssueNumber,
    driftIssueRepo,
  });

  // Set outputs
  core.setOutput("working_directory_file", result.working_directory_file);
  core.setOutput("module_file", result.module_file);
  core.setOutput("renovate_login", result.renovate_login);
  core.setOutput("draft_pr", result.draft_pr);
  core.setOutput("skip_create_pr", result.skip_create_pr);
  core.setOutput("plan_workflow_name", result.plan_workflow_name);
  core.setOutput("label_prefix_tfmigrate", result.label_prefix_tfmigrate);
  core.setOutput("label_prefix_skip", result.label_prefix_skip);
  core.setOutput("drift_issue_repo_owner", result.drift_issue_repo_owner);
  core.setOutput("drift_issue_repo_name", result.drift_issue_repo_name);
  core.setOutput(
    "disable_update_related_pull_requests",
    result.disable_update_related_pull_requests,
  );
  core.setOutput(
    "update_local_path_module_caller",
    result.update_local_path_module_caller,
  );
  core.setOutput(
    "aqua_update_checksum_enabled",
    result.aqua_update_checksum_enabled,
  );
  core.setOutput(
    "aqua_update_checksum_prune",
    result.aqua_update_checksum_prune,
  );
  core.setOutput(
    "aqua_update_checksum_skip_push",
    result.aqua_update_checksum_skip_push,
  );
  core.setOutput("enable_tflint", result.enable_tflint);
  core.setOutput("enable_trivy", result.enable_trivy);
  core.setOutput("tflint_fix", result.tflint_fix);
  core.setOutput("terraform_command", result.terraform_command);
  core.setOutput(
    "follow_up_pr_group_label_prefix",
    result.follow_up_pr_group_label_prefix,
  );
  core.setOutput(
    "follow_up_pr_group_label_enabled",
    result.follow_up_pr_group_label_enabled,
  );
  core.setOutput(
    "securefix_action_server_repository",
    result.securefix_action_server_repository,
  );
  core.setOutput(
    "securefix_action_pull_request_base_branch",
    result.securefix_action_pull_request_base_branch,
  );
  core.setOutput("max_changed_working_dirs", result.max_changed_working_dirs);
  core.setOutput("max_changed_modules", result.max_changed_modules);
};
