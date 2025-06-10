import * as core from "@actions/core";
import * as lib from "../lib";

export const main = async () => {
  const config = lib.getConfig();
  const result = main_(config, {
    repository: process.env.GITHUB_REPOSITORY,
    drift_issue_number: process.env.TFACTION_DRIFT_ISSUE_NUMBER,
  });
  for (const [key, value] of Object.entries(result.envs)) {
    core.exportVariable(key, value);
  }
  for (const [key, value] of Object.entries(result.outputs)) {
    core.setOutput(key, value);
  }
};

interface Input {
  repository?: string;
  drift_issue_number?: string;
}

export interface Result {
  outputs: Outputs;
  envs: Envs;
}

interface Outputs {
  base_working_directory: string;
  working_directory_file: string;
  module_base_directory: string;
  module_file: string;
  renovate_login: string;
  draft_pr: boolean;
  skip_create_pr: boolean;
  plan_workflow_name: string;

  label_prefix_target: string;
  label_prefix_tfmigrate: string;
  label_prefix_skip: string;
  drift_issue_repo_owner: string;
  drift_issue_repo_name: string;
  disable_update_related_pull_requests: boolean;
  update_local_path_module_caller: boolean;
  aqua_update_checksum_enabled: boolean;
  aqua_update_checksum_prune: boolean;
  aqua_update_checksum_skip_push: boolean;

  enable_tfsec: boolean;
  enable_tflint: boolean;
  enable_trivy: boolean;
  tflint_fix: boolean;

  terraform_command: string;

  follow_up_pr_group_label_prefix: string;
  follow_up_pr_group_label_enabled: boolean;

  max_changed_working_directories?: number;
  max_changed_modules?: number;
}

interface Envs {
  TFACTION_SKIP_ADDING_AQUA_PACKAGES: boolean;
}

export const main_ = (config: lib.Config, input: Input): Result => {
  if (!config.plan_workflow_name) {
    throw new Error(
      'The setting "plan_workflow_name" is required in tfaction-root.yaml',
    );
  }

  const outputs: Outputs = {
    base_working_directory: config.base_working_directory || ".",
    working_directory_file: config.working_directory_file || "tfaction.yaml",
    module_base_directory: config.module_base_directory || ".",
    module_file: config.module_file || "tfaction_module.yaml",
    renovate_login: config.renovate_login || "renovate[bot]",
    draft_pr: !!config.draft_pr,
    skip_create_pr: !!config.skip_create_pr,
    plan_workflow_name: config.plan_workflow_name,
    label_prefix_target: config?.label_prefixes?.target || "target:",
    label_prefix_tfmigrate: config?.label_prefixes?.tfmigrate || "tfmigrate:",
    label_prefix_skip: config?.label_prefixes?.skip || "skip:",
    disable_update_related_pull_requests: !(
      config?.update_related_pull_requests?.enabled ?? true
    ),
    update_local_path_module_caller:
      config?.update_local_path_module_caller?.enabled ?? false,
    aqua_update_checksum_enabled:
      config?.aqua?.update_checksum?.enabled ?? false,
    aqua_update_checksum_prune: config?.aqua?.update_checksum?.prune ?? false,
    aqua_update_checksum_skip_push: input.drift_issue_number
      ? true
      : (config?.aqua?.update_checksum?.skip_push ?? false),
    enable_tfsec: config?.tfsec?.enabled ?? false,
    enable_tflint: config?.tflint?.enabled ?? true,
    enable_trivy: config?.trivy?.enabled ?? true,
    tflint_fix: config?.tflint?.fix ?? false,
    terraform_command: config?.terraform_command || "terraform",

    drift_issue_repo_owner: "",
    drift_issue_repo_name: "",

    follow_up_pr_group_label_prefix:
      config?.follow_up_pr_group_label?.prefix ||
      "tfaction:follow-up-pr-group/",
    follow_up_pr_group_label_enabled:
      config?.follow_up_pr_group_label?.enabled ?? false,

    max_changed_working_directories:
      config?.limit_changed_dirs?.working_directories ?? 0,
    max_changed_modules: config?.limit_changed_dirs?.modules ?? 0,
  };
  const envs: Envs = {
    TFACTION_SKIP_ADDING_AQUA_PACKAGES:
      config?.scaffold_working_directory?.skip_adding_aqua_packages ?? true,
  };

  if (config.drift_detection && config.drift_detection.issue_repo_owner) {
    outputs.drift_issue_repo_owner = config.drift_detection.issue_repo_owner;
  } else {
    if (input.repository) {
      outputs.drift_issue_repo_owner = input.repository.split("/")[0];
    }
  }

  if (config.drift_detection && config.drift_detection.issue_repo_name) {
    outputs.drift_issue_repo_name = config.drift_detection.issue_repo_name;
  } else {
    if (input.repository) {
      const a = input.repository.split("/");
      if (a.length > 1) {
        outputs.drift_issue_repo_name = a[1];
      }
    }
  }

  return {
    outputs: outputs,
    envs: envs,
  };
};
