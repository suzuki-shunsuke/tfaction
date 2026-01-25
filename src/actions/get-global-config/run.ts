import type { Config } from "../../lib/types";

export type DriftIssueRepo = {
  owner: string;
  name: string;
};

export type RunInput = {
  config: Config;
  driftIssueNumber: string | undefined;
  driftIssueRepo: DriftIssueRepo;
};

export type RunResult = {
  working_directory_file: string;
  module_file: string;
  renovate_login: string;
  draft_pr: boolean;
  skip_create_pr: boolean;
  plan_workflow_name: string;
  label_prefix_tfmigrate: string;
  label_prefix_skip: string;
  drift_issue_repo_owner: string;
  drift_issue_repo_name: string;
  disable_update_related_pull_requests: boolean;
  update_local_path_module_caller: boolean;
  aqua_update_checksum_enabled: boolean;
  aqua_update_checksum_prune: boolean;
  aqua_update_checksum_skip_push: boolean;
  enable_tflint: boolean;
  enable_trivy: boolean;
  tflint_fix: boolean;
  terraform_command: string;
  follow_up_pr_group_label_prefix: string;
  follow_up_pr_group_label_enabled: boolean;
  securefix_action_server_repository: string;
  securefix_action_pull_request_base_branch: string;
  max_changed_working_dirs: number;
  max_changed_modules: number;
};

export const run = (input: RunInput): RunResult => {
  const { config, driftIssueNumber, driftIssueRepo } = input;

  return {
    working_directory_file: config.working_directory_file,
    module_file: config.module_file,
    renovate_login: config.renovate_login,
    draft_pr: config.draft_pr,
    skip_create_pr: config.skip_create_pr,
    plan_workflow_name: config.plan_workflow_name,
    label_prefix_tfmigrate: config.label_prefixes.tfmigrate,
    label_prefix_skip: config.label_prefixes.skip,
    drift_issue_repo_owner: driftIssueRepo.owner,
    drift_issue_repo_name: driftIssueRepo.name,
    disable_update_related_pull_requests: !(
      config.update_related_pull_requests?.enabled ?? true
    ),
    update_local_path_module_caller:
      config.update_local_path_module_caller?.enabled ?? false,
    aqua_update_checksum_enabled:
      config.aqua?.update_checksum?.enabled ?? false,
    aqua_update_checksum_prune: config.aqua?.update_checksum?.prune ?? false,
    aqua_update_checksum_skip_push: driftIssueNumber
      ? true
      : (config.aqua?.update_checksum?.skip_push ?? false),
    enable_tflint: config.tflint?.enabled ?? true,
    enable_trivy: config.trivy?.enabled ?? true,
    tflint_fix: config.tflint?.fix ?? false,
    terraform_command: config.terraform_command,
    follow_up_pr_group_label_prefix:
      config.follow_up_pr?.group_label?.prefix ?? "tfaction:follow-up-pr-group/",
    follow_up_pr_group_label_enabled:
      config.follow_up_pr?.group_label?.enabled ?? false,
    securefix_action_server_repository:
      config.securefix_action?.server_repository ?? "",
    securefix_action_pull_request_base_branch:
      config.securefix_action?.pull_request?.base_branch ?? "",
    max_changed_working_dirs: config.limit_changed_dirs?.working_dirs ?? 0,
    max_changed_modules: config.limit_changed_dirs?.modules ?? 0,
  };
};
