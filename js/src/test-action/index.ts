import * as lib from "../lib";
import * as core from "@actions/core";
import * as fs from "fs";
import { diffString } from "json-diff";

export const main = async () => {
  // Compare outputs
  const testdata = [
    {
      name: "get-target-config",
      expected: {
        working_directory: "js/test/aws/foo/dev",
        aws_assume_role_arn:
          "arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_terraform_plan",
        aws_region: "ap-northeast-1",
        // aws_role_session_name: "tfaction-plan-js_test_aws_foo_dev-12425638978",
        aws_role_session_name: "",
        gcp_service_account: "",
        gcp_workload_identity_provider: "",
        gcp_access_token_scopes: "",
        s3_bucket_name_tfmigrate_history:
          "0000-0000-0000-suzuki-shunsuke-tfmigrate-history",
        gcs_bucket_name_tfmigrate_history: "",
        template_dir: "js/test/templates/aws",
        providers_lock_opts: "-platform=linux_amd64 -platform=darwin_amd64",
        enable_tfsec: "false",
        enable_tflint: "true",
        enable_trivy: "true",
        enable_terraform_docs: "false",
        destroy: "false",
        terraform_command: "terraform",
        tflint_fix: "true",
      },
      convert: (data: any): any => {
        data.aws_role_session_name = "";
        return data;
      },
      actual: process.env.GET_TARGET_CONFIG,
    },
    {
      name: "js/get-target-config",
      expected: {
        working_directory: "js/test/aws/foo/dev",
        providers_lock_opts: "-platform=linux_amd64 -platform=darwin_amd64",
        template_dir: "js/test/templates/aws",
        enable_tfsec: "false",
        enable_tflint: "true",
        enable_trivy: "true",
        tflint_fix: "true",
        terraform_command: "terraform",
        s3_bucket_name_tfmigrate_history:
          "0000-0000-0000-suzuki-shunsuke-tfmigrate-history",
        aws_region: "ap-northeast-1",
        aws_assume_role_arn:
          "arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_terraform_plan",
        // aws_role_session_name: "tfaction-plan-js_test_aws_foo_dev-12425638978",
        aws_role_session_name: "",
        destroy: "false",
        enable_terraform_docs: "false",
      },
      convert: (data: any): any => {
        data.aws_role_session_name = "";
        return data;
      },
      actual: process.env.JS_TARGET_CONFIG,
    },
    {
      name: "get-global-config",
      expected: {
        base_working_directory: ".",
        module_base_directory: ".",
        working_directory_file: "tfaction.yaml",
        module_file: "tfaction_module.yaml",
        renovate_login: "renovate[bot]",
        label_prefix_target: "target:",
        label_prefix_tfmigrate: "migrate:",
        label_prefix_skip: "skip:",
        skip_create_pr: "false",
        drift_issue_repo_owner: "suzuki-shunsuke",
        drift_issue_repo_name: "test-tfaction",
        enable_tfsec: "false",
        enable_tflint: "true",
        enable_trivy: "true",
        tflint_fix: "true",
        update_local_path_module_caller: "true",
        aqua_update_checksum_enabled: "true",
        aqua_update_checksum_skip_push: "false",
        aqua_update_checksum_prune: "true",
        plan_workflow_name: "test",
        terraform_command: "terraform",
        follow_up_pr_group_label_prefix: "tfaction:follow-up-pr-group/",
        follow_up_pr_group_label_enabled: "false",
        max_changed_working_directories: "0",
        max_changed_modules: "0",
      },
      actual: process.env.GET_GLOBAL_CONFIG,
    },
    {
      name: "js/get-global-config",
      expected: {
        base_working_directory: ".",
        working_directory_file: "tfaction.yaml",
        module_base_directory: ".",
        module_file: "tfaction_module.yaml",
        renovate_login: "renovate[bot]",
        draft_pr: "false",
        skip_create_pr: "false",
        plan_workflow_name: "test",
        label_prefix_target: "target:",
        label_prefix_tfmigrate: "migrate:",
        label_prefix_skip: "skip:",
        disable_update_related_pull_requests: "false",
        update_local_path_module_caller: "true",
        aqua_update_checksum_enabled: "true",
        aqua_update_checksum_prune: "true",
        aqua_update_checksum_skip_push: "false",
        enable_tfsec: "false",
        enable_tflint: "true",
        enable_trivy: "true",
        tflint_fix: "true",
        terraform_command: "terraform",
        drift_issue_repo_owner: "suzuki-shunsuke",
        drift_issue_repo_name: "test-tfaction",
        follow_up_pr_group_label_prefix: "tfaction:follow-up-pr-group/",
        follow_up_pr_group_label_enabled: "false",
        max_changed_working_directories: "0",
        max_changed_modules: "0",
      },
      actual: process.env.JS_GLOBAL_CONFIG,
    },
    {
      name: "check-terraform-skip",
      expected: {
        skip_terraform: "false",
      },
      actual: process.env.CHECK_TERRAFORM_SKIP,
    },
    {
      name: "js/check-terraform-skip",
      expected: {
        skip_terraform: "false",
      },
      actual: process.env.JS_CHECK_TERRAFORM_SKIP,
    },
    {
      name: "list-changed-modules",
      expected: {
        modules: '["js/test/modules/foo"]',
      },
      actual: process.env.LIST_CHANGED_MODULES,
    },
    {
      name: "js/list-changed-modules",
      expected: {
        modules: '["js/test/modules/foo"]',
      },
      actual: process.env.JS_LIST_CHANGED_MODULES,
    },
    {
      name: "list-module-callers",
      expected: {
        file: '{"js/test/modules/foo":["js/test/aws/foo/dev"]}',
      },
      actual: process.env.LIST_MODULE_CALLERS,
    },
    {
      name: "js/list-module-callers",
      expected: {
        file: '{"js/test/modules/foo":["js/test/aws/foo/dev"]}',
      },
      actual: process.env.JS_LIST_MODULE_CALLERS,
    },
    {
      name: "list-targets-with-changed-files",
      expected: {
        targets: "[]",
        modules: '["js/test/modules/foo"]',
      },
      actual: process.env.LIST_TARGETS_WITH_CHANGED_FILES,
    },
    {
      name: "js/list-targets-with-changed-files",
      expected: {
        targets: "[]",
        modules: '["js/test/modules/foo"]',
      },
      actual: process.env.JS_LIST_TARGETS_WITH_CHANGED_FILES,
    },
  ];
  let failed = false;
  testdata.forEach((data) => {
    let a = JSON.parse(data.actual || "{}");
    if (data.convert) {
      a = data.convert(a);
    }
    const b = diffString(data.expected, a);
    if (b !== "") {
      console.log(`Test failed: ${data.name}`);
      console.log(b);
      failed = true;
    }
  });
  if (failed) {
    throw new Error("Test failed");
  }
};
