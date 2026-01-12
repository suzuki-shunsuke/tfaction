import { diffString } from "json-diff";

export const main = async () => {
  // Compare outputs
  const testdata = [
    {
      name: "get-target-config",
      expected: {
        working_directory: "aws/foo/dev",
        providers_lock_opts: "-platform=linux_amd64 -platform=darwin_amd64",
        template_dir: "templates/github",
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
      actual: process.env.TARGET_CONFIG,
    },
    {
      name: "get-global-config",
      expected: {
        working_directory_file: "tfaction.yaml",
        module_file: "tfaction_module.yaml",
        renovate_login: "renovate[bot]",
        draft_pr: "false",
        skip_create_pr: "false",
        plan_workflow_name: "test.yaml",
        label_prefix_tfmigrate: "migrate:",
        label_prefix_skip: "skip:",
        disable_update_related_pull_requests: "false",
        update_local_path_module_caller: "true",
        aqua_update_checksum_enabled: "true",
        aqua_update_checksum_prune: "true",
        aqua_update_checksum_skip_push: "false",
        enable_tflint: "true",
        enable_trivy: "true",
        tflint_fix: "true",
        terraform_command: "terraform",
        drift_issue_repo_owner: "suzuki-shunsuke",
        drift_issue_repo_name: "test-tfaction",
        follow_up_pr_group_label_prefix: "tfaction:follow-up-pr-group/",
        follow_up_pr_group_label_enabled: "false",
        max_changed_working_dirs: "0",
        max_changed_modules: "0",
        securefix_action_server_repository: "",
        securefix_action_pull_request_base_branch: "",
      },
      actual: process.env.GLOBAL_CONFIG,
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
