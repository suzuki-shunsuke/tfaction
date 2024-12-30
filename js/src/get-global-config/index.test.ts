import { main_, Result } from "./index";

test("default", () => {
  const result: Result = {
    envs: {
      TFACTION_SKIP_ADDING_AQUA_PACKAGES: true,
    },
    outputs: {
      base_working_directory: ".",
      working_directory_file: "tfaction.yaml",
      module_base_directory: ".",
      module_file: "tfaction_module.yaml",
      renovate_login: "renovate[bot]",
      draft_pr: false,
      skip_create_pr: false,
      plan_workflow_name: "plan",

      label_prefix_target: "target:",
      label_prefix_tfmigrate: "tfmigrate:",
      label_prefix_skip: "skip:",
      drift_issue_repo_owner: "",
      drift_issue_repo_name: "",
      disable_update_related_pull_requests: false,
      aqua_update_checksum_enabled: false,
      aqua_update_checksum_prune: false,
      aqua_update_checksum_skip_push: false,
      update_local_path_module_caller: false,

      enable_tfsec: false,
      enable_tflint: true,
      enable_trivy: true,
      tflint_fix: false,
      terraform_command: "terraform",
    },
  };
  expect(
    main_(
      {
        label_prefixes: {
          skip: "skip:",
        },
        plan_workflow_name: "plan",
        target_groups: [],
      },
      {
        repository: "",
        drift_issue_number: "",
      },
    ),
  ).toStrictEqual(result);
});

test("plan_workflow_name is required", () => {
  expect(() => {
    main_(
      {
        plan_workflow_name: "",
        label_prefixes: {
          skip: "skip:",
        },
        target_groups: [],
      },
      {
        repository: "",
        drift_issue_number: "",
      },
    );
  }).toThrow();
});

test("customize", () => {
  const result: Result = {
    envs: {
      TFACTION_SKIP_ADDING_AQUA_PACKAGES: true,
    },
    outputs: {
      plan_workflow_name: "plan",
      base_working_directory: "terraform",
      working_directory_file: "tfaction-config.yaml",
      module_base_directory: "modules",
      module_file: "tfaction-module.yaml",
      renovate_login: "renovate-custom[bot]",
      draft_pr: true,
      skip_create_pr: true,
      update_local_path_module_caller: false,

      label_prefix_target: "target:",
      label_prefix_tfmigrate: "tfmigrate:",
      label_prefix_skip: "skip:",
      drift_issue_repo_owner: "",
      drift_issue_repo_name: "",
      disable_update_related_pull_requests: false,
      aqua_update_checksum_enabled: false,
      aqua_update_checksum_prune: false,
      aqua_update_checksum_skip_push: false,

      enable_tfsec: false,
      enable_tflint: true,
      enable_trivy: true,
      tflint_fix: false,
      terraform_command: "tofu",
    },
  };

  expect(
    main_(
      {
        label_prefixes: {
          skip: "skip:",
        },
        target_groups: [],
        plan_workflow_name: "plan",
        base_working_directory: "terraform",
        working_directory_file: "tfaction-config.yaml",
        module_base_directory: "modules",
        module_file: "tfaction-module.yaml",
        renovate_login: "renovate-custom[bot]",
        draft_pr: true,
        skip_create_pr: true,
        terraform_command: "tofu",
      },
      {
        repository: "",
        drift_issue_number: "",
      },
    ),
  ).toStrictEqual(result);
});
