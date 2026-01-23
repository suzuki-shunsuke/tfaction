import { run, Result } from "./index";
import * as lib from "../../lib";
import * as env from "../../lib/env";
import { expect, test } from "vitest";

test("default", async () => {
  const runID = env.githubRunId;
  const result: Result = {
    envs: new Map<string, string | boolean>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "tests/aws/foo/dev"],
    ]),
    outputs: new Map<string, string | boolean>([
      ["working_directory", "tests/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "tests/templates/github"],
      ["aws_role_session_name", "tfaction-plan-tests_aws_foo_dev-" + runID],
      ["enable_tflint", true],
      ["enable_trivy", true],
      ["enable_terraform_docs", false],
      ["destroy", false],
      ["tflint_fix", false],
      ["terraform_command", "terraform"],
    ]),
  };
  expect(
    await run(
      {
        target: "tests/aws/foo/dev",
        workingDir: "tests/aws/foo/dev",
        isApply: false,
        jobType: "terraform",
      },
      await lib.applyConfigDefaults(
        {
          plan_workflow_name: "plan.yaml",
          target_groups: [
            {
              working_directory: "tests/aws",
              template_dir: "tests/templates/github",
            },
          ],
        },
        "tests/tfaction-root.yaml",
      ),
    ),
  ).toStrictEqual(result);
});

test("config", async () => {
  const result: Result = {
    envs: new Map<string, string | boolean>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "tests/aws/foo/dev"],
    ]),
    outputs: new Map<string, string | boolean>([
      ["working_directory", "tests/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "tests/templates/github"],
      ["enable_tflint", false],
      ["enable_trivy", false],
      ["tflint_fix", false],
      ["aws_region", "ap-northeast-1"],
      ["terraform_command", "tofu"],
      ["aws_role_session_name", "test"],
      ["destroy", false],
      ["enable_terraform_docs", false],
    ]),
  };
  expect(
    await run(
      {
        target: "tests/aws/foo/dev",
        workingDir: "tests/aws/foo/dev",
        isApply: false,
        jobType: "terraform",
      },
      await lib.applyConfigDefaults(
        {
          plan_workflow_name: "plan.yaml",
          terraform_command: "tofu",
          tflint: {
            enabled: false,
          },
          trivy: {
            enabled: false,
          },
          target_groups: [
            {
              working_directory: "tests/aws",
              template_dir: "tests/templates/github",
              aws_region: "ap-northeast-1",
              aws_role_session_name: "test",
            },
          ],
        },
        "tests/tfaction-root.yaml",
      ),
    ),
  ).toStrictEqual(result);
});

test("scaffold_working_dir", async () => {
  const result: Result = {
    envs: new Map<string, string | boolean>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "tests/aws/foo/dev"],
    ]),
    outputs: new Map<string, string | boolean>([
      ["working_directory", "tests/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "tests/templates/github"],
      ["enable_tflint", true],
      ["enable_trivy", true],
      ["tflint_fix", false],
      ["terraform_command", "terraform"],
    ]),
  };
  expect(
    await run(
      {
        target: "tests/aws/foo/dev",
        workingDir: "tests/aws/foo/dev",
        isApply: false,
        jobType: "scaffold_working_dir",
      },
      await lib.applyConfigDefaults(
        {
          plan_workflow_name: "plan.yaml",
          target_groups: [
            {
              working_directory: "tests/aws",
              template_dir: "tests/templates/github",
            },
          ],
        },
        "tests/tfaction-root.yaml",
      ),
    ),
  ).toStrictEqual(result);
});

test("tfmigrate plan", async () => {
  const runID = env.githubRunId;
  const result: Result = {
    envs: new Map<string, string | boolean>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "tests/aws/foo/dev"],
    ]),
    outputs: new Map<string, string | boolean>([
      ["working_directory", "tests/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "tests/templates/github"],
      ["enable_tflint", true],
      ["enable_trivy", true],
      ["enable_terraform_docs", false],
      ["destroy", false],
      ["tflint_fix", false],
      ["terraform_command", "terraform"],
      ["aws_assume_role_arn", "arn:aws:iam::123:role/tfmigrate-plan"],
      ["aws_role_session_name", "tfaction-plan-tests_aws_foo_dev-" + runID],
    ]),
  };
  expect(
    await run(
      {
        target: "tests/aws/foo/dev",
        workingDir: "tests/aws/foo/dev",
        isApply: false,
        jobType: "tfmigrate",
      },
      await lib.applyConfigDefaults(
        {
          plan_workflow_name: "plan.yaml",
          target_groups: [
            {
              working_directory: "tests/aws",
              template_dir: "tests/templates/github",
              tfmigrate_plan_config: {
                aws_assume_role_arn: "arn:aws:iam::123:role/tfmigrate-plan",
              },
            },
          ],
        },
        "tests/tfaction-root.yaml",
      ),
    ),
  ).toStrictEqual(result);
});

test("tfmigrate apply", async () => {
  const runID = env.githubRunId;
  const result: Result = {
    envs: new Map<string, string | boolean>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "tests/aws/foo/dev"],
    ]),
    outputs: new Map<string, string | boolean>([
      ["working_directory", "tests/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "tests/templates/github"],
      ["enable_tflint", true],
      ["enable_trivy", true],
      ["enable_terraform_docs", false],
      ["destroy", false],
      ["tflint_fix", false],
      ["terraform_command", "terraform"],
      ["aws_assume_role_arn", "arn:aws:iam::123:role/tfmigrate-apply"],
      ["aws_role_session_name", "tfaction-apply-tests_aws_foo_dev-" + runID],
    ]),
  };
  expect(
    await run(
      {
        target: "tests/aws/foo/dev",
        workingDir: "tests/aws/foo/dev",
        isApply: true,
        jobType: "tfmigrate",
      },
      await lib.applyConfigDefaults(
        {
          plan_workflow_name: "plan.yaml",
          target_groups: [
            {
              working_directory: "tests/aws",
              template_dir: "tests/templates/github",
              tfmigrate_apply_config: {
                aws_assume_role_arn: "arn:aws:iam::123:role/tfmigrate-apply",
              },
            },
          ],
        },
        "tests/tfaction-root.yaml",
      ),
    ),
  ).toStrictEqual(result);
});

test("terraform apply", async () => {
  const runID = env.githubRunId;
  const result: Result = {
    envs: new Map<string, string | boolean>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "tests/aws/foo/dev"],
    ]),
    outputs: new Map<string, string | boolean>([
      ["working_directory", "tests/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "tests/templates/github"],
      ["enable_tflint", true],
      ["enable_trivy", true],
      ["enable_terraform_docs", false],
      ["destroy", false],
      ["tflint_fix", false],
      ["terraform_command", "terraform"],
      ["aws_assume_role_arn", "arn:aws:iam::123:role/terraform-apply"],
      ["aws_role_session_name", "tfaction-apply-tests_aws_foo_dev-" + runID],
    ]),
  };
  expect(
    await run(
      {
        target: "tests/aws/foo/dev",
        workingDir: "tests/aws/foo/dev",
        isApply: true,
        jobType: "terraform",
      },
      await lib.applyConfigDefaults(
        {
          plan_workflow_name: "plan.yaml",
          target_groups: [
            {
              working_directory: "tests/aws",
              template_dir: "tests/templates/github",
              terraform_apply_config: {
                aws_assume_role_arn: "arn:aws:iam::123:role/terraform-apply",
              },
            },
          ],
        },
        "tests/tfaction-root.yaml",
      ),
    ),
  ).toStrictEqual(result);
});

test("explicit aws_role_session_name overrides auto-generation", async () => {
  const result: Result = {
    envs: new Map<string, string | boolean>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "tests/aws/foo/dev"],
    ]),
    outputs: new Map<string, string | boolean>([
      ["working_directory", "tests/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "tests/templates/github"],
      ["enable_tflint", true],
      ["enable_trivy", true],
      ["enable_terraform_docs", false],
      ["destroy", false],
      ["tflint_fix", false],
      ["terraform_command", "terraform"],
      ["aws_role_session_name", "custom-session-name"],
    ]),
  };
  expect(
    await run(
      {
        target: "tests/aws/foo/dev",
        workingDir: "tests/aws/foo/dev",
        isApply: false,
        jobType: "terraform",
      },
      await lib.applyConfigDefaults(
        {
          plan_workflow_name: "plan.yaml",
          target_groups: [
            {
              working_directory: "tests/aws",
              template_dir: "tests/templates/github",
              aws_role_session_name: "custom-session-name",
            },
          ],
        },
        "tests/tfaction-root.yaml",
      ),
    ),
  ).toStrictEqual(result);
});

test("terraform_docs enabled in root config", async () => {
  const runID = env.githubRunId;
  const result: Result = {
    envs: new Map<string, string | boolean>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "tests/aws/foo/dev"],
    ]),
    outputs: new Map<string, string | boolean>([
      ["working_directory", "tests/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "tests/templates/github"],
      ["enable_tflint", true],
      ["enable_trivy", true],
      ["enable_terraform_docs", true],
      ["destroy", false],
      ["tflint_fix", false],
      ["terraform_command", "terraform"],
      ["aws_role_session_name", "tfaction-plan-tests_aws_foo_dev-" + runID],
    ]),
  };
  expect(
    await run(
      {
        target: "tests/aws/foo/dev",
        workingDir: "tests/aws/foo/dev",
        isApply: false,
        jobType: "terraform",
      },
      await lib.applyConfigDefaults(
        {
          plan_workflow_name: "plan.yaml",
          terraform_docs: {
            enabled: true,
          },
          target_groups: [
            {
              working_directory: "tests/aws",
              template_dir: "tests/templates/github",
            },
          ],
        },
        "tests/tfaction-root.yaml",
      ),
    ),
  ).toStrictEqual(result);
});

test("environment variables from targetGroup", async () => {
  const runID = env.githubRunId;
  const result: Result = {
    envs: new Map<string, string | boolean>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "tests/aws/foo/dev"],
      ["TF_VAR_env", "dev"],
      ["AWS_DEFAULT_REGION", "ap-northeast-1"],
    ]),
    outputs: new Map<string, string | boolean>([
      ["working_directory", "tests/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "tests/templates/github"],
      ["enable_tflint", true],
      ["enable_trivy", true],
      ["enable_terraform_docs", false],
      ["destroy", false],
      ["tflint_fix", false],
      ["terraform_command", "terraform"],
      ["aws_role_session_name", "tfaction-plan-tests_aws_foo_dev-" + runID],
    ]),
  };
  expect(
    await run(
      {
        target: "tests/aws/foo/dev",
        workingDir: "tests/aws/foo/dev",
        isApply: false,
        jobType: "terraform",
      },
      await lib.applyConfigDefaults(
        {
          plan_workflow_name: "plan.yaml",
          target_groups: [
            {
              working_directory: "tests/aws",
              template_dir: "tests/templates/github",
              env: {
                TF_VAR_env: "dev",
                AWS_DEFAULT_REGION: "ap-northeast-1",
              },
            },
          ],
        },
        "tests/tfaction-root.yaml",
      ),
    ),
  ).toStrictEqual(result);
});

test("environment variables from root config", async () => {
  const runID = env.githubRunId;
  const result: Result = {
    envs: new Map<string, string | boolean>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "tests/aws/foo/dev"],
      ["GLOBAL_VAR", "global-value"],
    ]),
    outputs: new Map<string, string | boolean>([
      ["working_directory", "tests/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "tests/templates/github"],
      ["enable_tflint", true],
      ["enable_trivy", true],
      ["enable_terraform_docs", false],
      ["destroy", false],
      ["tflint_fix", false],
      ["terraform_command", "terraform"],
      ["aws_role_session_name", "tfaction-plan-tests_aws_foo_dev-" + runID],
    ]),
  };
  expect(
    await run(
      {
        target: "tests/aws/foo/dev",
        workingDir: "tests/aws/foo/dev",
        isApply: false,
        jobType: "terraform",
      },
      await lib.applyConfigDefaults(
        {
          plan_workflow_name: "plan.yaml",
          env: {
            GLOBAL_VAR: "global-value",
          },
          target_groups: [
            {
              working_directory: "tests/aws",
              template_dir: "tests/templates/github",
            },
          ],
        },
        "tests/tfaction-root.yaml",
      ),
    ),
  ).toStrictEqual(result);
});

test("gcp configuration", async () => {
  const runID = env.githubRunId;
  const result: Result = {
    envs: new Map<string, string | boolean>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "tests/aws/foo/dev"],
    ]),
    outputs: new Map<string, string | boolean>([
      ["working_directory", "tests/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["enable_tflint", true],
      ["enable_trivy", true],
      ["tflint_fix", false],
      ["terraform_command", "terraform"],
      ["template_dir", "tests/templates/github"],
      ["aws_role_session_name", "tfaction-plan-tests_aws_foo_dev-" + runID],
      ["gcp_service_account", "sa@project.iam.gserviceaccount.com"],
      [
        "gcp_workload_identity_provider",
        "projects/123/locations/global/workloadIdentityPools/pool/providers/provider",
      ],
      [
        "gcp_remote_backend_service_account",
        "backend-sa@project.iam.gserviceaccount.com",
      ],
      [
        "gcp_remote_backend_workload_identity_provider",
        "projects/456/locations/global/workloadIdentityPools/pool/providers/provider",
      ],
      ["destroy", false],
      ["enable_terraform_docs", false],
    ]),
  };
  expect(
    await run(
      {
        target: "tests/aws/foo/dev",
        workingDir: "tests/aws/foo/dev",
        isApply: false,
        jobType: "terraform",
      },
      await lib.applyConfigDefaults(
        {
          plan_workflow_name: "plan.yaml",
          target_groups: [
            {
              working_directory: "tests/aws",
              template_dir: "tests/templates/github",
              gcp_service_account: "sa@project.iam.gserviceaccount.com",
              gcp_workload_identity_provider:
                "projects/123/locations/global/workloadIdentityPools/pool/providers/provider",
              gcp_remote_backend_service_account:
                "backend-sa@project.iam.gserviceaccount.com",
              gcp_remote_backend_workload_identity_provider:
                "projects/456/locations/global/workloadIdentityPools/pool/providers/provider",
            },
          ],
        },
        "tests/tfaction-root.yaml",
      ),
    ),
  ).toStrictEqual(result);
});

test("gcp_access_token_scopes", async () => {
  const runID = env.githubRunId;
  const result: Result = {
    envs: new Map<string, string | boolean>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "tests/aws/foo/dev"],
    ]),
    outputs: new Map<string, string | boolean>([
      ["working_directory", "tests/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "tests/templates/github"],
      ["enable_tflint", true],
      ["enable_trivy", true],
      ["enable_terraform_docs", false],
      ["destroy", false],
      ["tflint_fix", false],
      ["terraform_command", "terraform"],
      ["aws_role_session_name", "tfaction-plan-tests_aws_foo_dev-" + runID],
      ["gcp_access_token_scopes", "https://www.googleapis.com/auth/bigquery"],
    ]),
  };
  expect(
    await run(
      {
        target: "tests/aws/foo/dev",
        workingDir: "tests/aws/foo/dev",
        isApply: false,
        jobType: "terraform",
      },
      await lib.applyConfigDefaults(
        {
          plan_workflow_name: "plan.yaml",
          target_groups: [
            {
              working_directory: "tests/aws",
              template_dir: "tests/templates/github",
              terraform_plan_config: {
                gcp_access_token_scopes:
                  "https://www.googleapis.com/auth/bigquery",
              },
            },
          ],
        },
        "tests/tfaction-root.yaml",
      ),
    ),
  ).toStrictEqual(result);
});

test("s3_bucket_name_tfmigrate_history", async () => {
  const runID = env.githubRunId;
  const result: Result = {
    envs: new Map<string, string | boolean>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "tests/aws/foo/dev"],
    ]),
    outputs: new Map<string, string | boolean>([
      ["working_directory", "tests/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "tests/templates/github"],
      ["enable_tflint", true],
      ["enable_trivy", true],
      ["enable_terraform_docs", false],
      ["destroy", false],
      ["tflint_fix", false],
      ["terraform_command", "terraform"],
      ["aws_role_session_name", "tfaction-plan-tests_aws_foo_dev-" + runID],
      ["s3_bucket_name_tfmigrate_history", "my-tfmigrate-bucket"],
    ]),
  };
  expect(
    await run(
      {
        target: "tests/aws/foo/dev",
        workingDir: "tests/aws/foo/dev",
        isApply: false,
        jobType: "terraform",
      },
      await lib.applyConfigDefaults(
        {
          plan_workflow_name: "plan.yaml",
          target_groups: [
            {
              working_directory: "tests/aws",
              template_dir: "tests/templates/github",
              s3_bucket_name_tfmigrate_history: "my-tfmigrate-bucket",
            },
          ],
        },
        "tests/tfaction-root.yaml",
      ),
    ),
  ).toStrictEqual(result);
});

test("gcs_bucket_name_tfmigrate_history", async () => {
  const runID = env.githubRunId;
  const result: Result = {
    envs: new Map<string, string | boolean>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "tests/aws/foo/dev"],
    ]),
    outputs: new Map<string, string | boolean>([
      ["working_directory", "tests/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "tests/templates/github"],
      ["enable_tflint", true],
      ["enable_trivy", true],
      ["enable_terraform_docs", false],
      ["destroy", false],
      ["tflint_fix", false],
      ["terraform_command", "terraform"],
      ["aws_role_session_name", "tfaction-plan-tests_aws_foo_dev-" + runID],
      ["gcs_bucket_name_tfmigrate_history", "my-gcs-tfmigrate-bucket"],
    ]),
  };
  expect(
    await run(
      {
        target: "tests/aws/foo/dev",
        workingDir: "tests/aws/foo/dev",
        isApply: false,
        jobType: "terraform",
      },
      await lib.applyConfigDefaults(
        {
          plan_workflow_name: "plan.yaml",
          target_groups: [
            {
              working_directory: "tests/aws",
              template_dir: "tests/templates/github",
              gcs_bucket_name_tfmigrate_history: "my-gcs-tfmigrate-bucket",
            },
          ],
        },
        "tests/tfaction-root.yaml",
      ),
    ),
  ).toStrictEqual(result);
});

test("providers_lock_opts override", async () => {
  const runID = env.githubRunId;
  const result: Result = {
    envs: new Map<string, string | boolean>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "tests/aws/foo/dev"],
    ]),
    outputs: new Map<string, string | boolean>([
      ["working_directory", "tests/aws/foo/dev"],
      ["providers_lock_opts", "-platform=linux_amd64"],
      ["template_dir", "tests/templates/github"],
      ["enable_tflint", true],
      ["enable_trivy", true],
      ["enable_terraform_docs", false],
      ["destroy", false],
      ["tflint_fix", false],
      ["terraform_command", "terraform"],
      ["aws_role_session_name", "tfaction-plan-tests_aws_foo_dev-" + runID],
    ]),
  };
  expect(
    await run(
      {
        target: "tests/aws/foo/dev",
        workingDir: "tests/aws/foo/dev",
        isApply: false,
        jobType: "terraform",
      },
      await lib.applyConfigDefaults(
        {
          plan_workflow_name: "plan.yaml",
          providers_lock_opts: "-platform=linux_amd64",
          target_groups: [
            {
              working_directory: "tests/aws",
              template_dir: "tests/templates/github",
            },
          ],
        },
        "tests/tfaction-root.yaml",
      ),
    ),
  ).toStrictEqual(result);
});
