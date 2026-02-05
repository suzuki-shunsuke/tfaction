import { run, Result } from "./index";
import * as lib from "../../lib";
import * as env from "../../lib/env";
import { expect, test } from "vitest";

test("default", async () => {
  const runID = env.all.GITHUB_RUN_ID;
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
      ["accept_change_by_renovate", false],
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
        "",
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
      ["accept_change_by_renovate", false],
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
        "",
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
        "",
      ),
    ),
  ).toStrictEqual(result);
});

test("tfmigrate plan", async () => {
  const runID = env.all.GITHUB_RUN_ID;
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
      ["accept_change_by_renovate", false],
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
        "",
      ),
    ),
  ).toStrictEqual(result);
});

test("tfmigrate apply", async () => {
  const runID = env.all.GITHUB_RUN_ID;
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
      ["accept_change_by_renovate", false],
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
        "",
      ),
    ),
  ).toStrictEqual(result);
});

test("terraform apply", async () => {
  const runID = env.all.GITHUB_RUN_ID;
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
      ["accept_change_by_renovate", false],
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
        "",
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
      ["accept_change_by_renovate", false],
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
        "",
      ),
    ),
  ).toStrictEqual(result);
});

test("terraform_docs enabled in root config", async () => {
  const runID = env.all.GITHUB_RUN_ID;
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
      ["accept_change_by_renovate", false],
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
        "",
      ),
    ),
  ).toStrictEqual(result);
});

test("environment variables from targetGroup", async () => {
  const runID = env.all.GITHUB_RUN_ID;
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
      ["accept_change_by_renovate", false],
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
        "",
      ),
    ),
  ).toStrictEqual(result);
});

test("environment variables from root config", async () => {
  const runID = env.all.GITHUB_RUN_ID;
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
      ["accept_change_by_renovate", false],
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
        "",
      ),
    ),
  ).toStrictEqual(result);
});

test("gcp configuration", async () => {
  const runID = env.all.GITHUB_RUN_ID;
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
      ["accept_change_by_renovate", false],
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
        "",
      ),
    ),
  ).toStrictEqual(result);
});

test("gcp_access_token_scopes", async () => {
  const runID = env.all.GITHUB_RUN_ID;
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
      ["accept_change_by_renovate", false],
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
        "",
      ),
    ),
  ).toStrictEqual(result);
});

test("s3_bucket_name_tfmigrate_history", async () => {
  const runID = env.all.GITHUB_RUN_ID;
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
      ["accept_change_by_renovate", false],
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
        "",
      ),
    ),
  ).toStrictEqual(result);
});

test("gcs_bucket_name_tfmigrate_history", async () => {
  const runID = env.all.GITHUB_RUN_ID;
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
      ["accept_change_by_renovate", false],
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
        "",
      ),
    ),
  ).toStrictEqual(result);
});

test("providers_lock_opts override", async () => {
  const runID = env.all.GITHUB_RUN_ID;
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
      ["accept_change_by_renovate", false],
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
        "",
      ),
    ),
  ).toStrictEqual(result);
});

test("aws_role_session_name truncation when target exceeds 64 characters", async () => {
  const runID = env.all.GITHUB_RUN_ID;
  // Use existing workingDir but with a very long target that differs
  // This tests that target is used for the session name, not workingDir
  const longTarget =
    "tests/aws/very/long/path/that/will/exceed/sixty/four/characters/limit/dev";
  const longTargetNormalized = longTarget.replaceAll("/", "_");
  const prefix = "tfaction-plan";

  // The full name would be `${prefix}-${normalizedTarget}-${runID}` which is too long
  // Expected to fall back to `${prefix}-${normalizedTarget}` or shorter
  const expectedName = (() => {
    const full = `${prefix}-${longTargetNormalized}-${runID}`;
    if (full.length <= 64) return full;
    const withoutRunID = `${prefix}-${longTargetNormalized}`;
    if (withoutRunID.length <= 64) return withoutRunID;
    const withRunIDOnly = `${prefix}-${runID}`;
    if (withRunIDOnly.length <= 64) return withRunIDOnly;
    return prefix;
  })();

  const result = await run(
    {
      // Use the long target but existing workingDir
      target: longTarget,
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
      "",
    ),
  );

  expect(result.outputs.get("aws_role_session_name")).toBe(expectedName);
  // Verify it's within the 64 character limit
  const roleName = result.outputs.get("aws_role_session_name");
  expect(typeof roleName === "string" && roleName.length <= 64).toBe(true);
});

test("only workingDir provided - target derived from workingDir", async () => {
  const runID = env.all.GITHUB_RUN_ID;
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
      ["accept_change_by_renovate", false],
      ["tflint_fix", false],
      ["terraform_command", "terraform"],
      ["aws_role_session_name", "tfaction-plan-tests_aws_foo_dev-" + runID],
    ]),
  };
  expect(
    await run(
      {
        // Only workingDir is provided, not target
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
        "",
      ),
    ),
  ).toStrictEqual(result);
});

test("tflint_fix enabled in root config", async () => {
  const runID = env.all.GITHUB_RUN_ID;
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
      ["accept_change_by_renovate", false],
      ["tflint_fix", true],
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
          tflint: {
            enabled: true,
            fix: true,
          },
          target_groups: [
            {
              working_directory: "tests/aws",
              template_dir: "tests/templates/github",
            },
          ],
        },
        "tests/tfaction-root.yaml",
        "",
      ),
    ),
  ).toStrictEqual(result);
});

test("target group env overrides root env", async () => {
  const runID = env.all.GITHUB_RUN_ID;
  const result: Result = {
    envs: new Map<string, string | boolean>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "tests/aws/foo/dev"],
      ["GLOBAL_VAR", "global-value"],
      ["OVERRIDE_VAR", "target-group-value"],
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
      ["accept_change_by_renovate", false],
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
            OVERRIDE_VAR: "root-value",
          },
          target_groups: [
            {
              working_directory: "tests/aws",
              template_dir: "tests/templates/github",
              env: {
                OVERRIDE_VAR: "target-group-value",
              },
            },
          ],
        },
        "tests/tfaction-root.yaml",
        "",
      ),
    ),
  ).toStrictEqual(result);
});

test("aws_role_session_name falls back to prefix with runID when target is very long", async () => {
  const runID = env.all.GITHUB_RUN_ID;
  // Create a target so long that even without runID it exceeds 64 chars
  // tfaction-apply- is 15 chars, so target needs to be > 49 chars when normalized
  const veryLongTarget =
    "tests/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/u/v/w/x/y/z/aa/bb/cc/dd";
  const prefix = "tfaction-apply";

  const result = await run(
    {
      // Use the very long target but existing workingDir
      target: veryLongTarget,
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
          },
        ],
      },
      "tests/tfaction-root.yaml",
      "",
    ),
  );

  const roleName = result.outputs.get("aws_role_session_name") as string;
  expect(roleName.length).toBeLessThanOrEqual(64);
  // When both full and target-only names exceed 64 chars, should fall back to prefix-runID
  expect(roleName).toBe(`${prefix}-${runID}`);
});
