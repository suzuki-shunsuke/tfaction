import { run, Result } from "./index";
import { expect, test } from "vitest";

test("default", async () => {
  const runID = process.env.GITHUB_RUN_ID ?? "";
  const result: Result = {
    envs: new Map<string, any>([
      ["TFACTION_WORKING_DIR", "test/aws/foo/dev"],
      ["TFACTION_TARGET", "test/aws/foo/dev"],
    ]),
    outputs: new Map<string, any>([
      ["working_directory", "test/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "templates/aws"],
      ["aws_role_session_name", "tfaction-plan-test_aws_foo_dev-" + runID],
      ["enable_tfsec", false],
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
        target: "test/aws/foo/dev",
        workingDir: "",
        isApply: false,
        jobType: "terraform",
      },
      {
        plan_workflow_name: "plan",
        target_groups: [
          {
            target: "test/aws/",
            working_directory: "test/aws/",
            template_dir: "templates/aws",
          },
        ],
      },
    ),
  ).toStrictEqual(result);
});

test("config", async () => {
  const result: Result = {
    envs: new Map<string, any>([
      ["TFACTION_WORKING_DIR", "test/aws/foo/dev"],
      ["TFACTION_TARGET", "test/aws/foo/dev"],
    ]),
    outputs: new Map<string, any>([
      ["working_directory", "test/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "templates/aws"],
      ["enable_tfsec", true],
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
        target: "test/aws/foo/dev",
        workingDir: "",
        isApply: false,
        jobType: "terraform",
      },
      {
        plan_workflow_name: "plan",
        terraform_command: "tofu",
        tfsec: {
          enabled: true,
        },
        tflint: {
          enabled: false,
        },
        trivy: {
          enabled: false,
        },
        target_groups: [
          {
            target: "test/aws/",
            working_directory: "test/aws/",
            template_dir: "templates/aws",
            aws_region: "ap-northeast-1",
            aws_role_session_name: "test",
          },
        ],
      },
    ),
  ).toStrictEqual(result);
});

test("scaffold_working_dir", async () => {
  const result: Result = {
    envs: new Map<string, any>([
      ["TFACTION_WORKING_DIR", "test/aws/foo/dev"],
      ["TFACTION_TARGET", "test/aws/foo/dev"],
    ]),
    outputs: new Map<string, any>([
      ["working_directory", "test/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "templates/aws"],
      ["enable_tfsec", false],
      ["enable_tflint", true],
      ["enable_trivy", true],
      ["tflint_fix", false],
      ["terraform_command", "terraform"],
    ]),
  };
  expect(
    await run(
      {
        target: "test/aws/foo/dev",
        workingDir: "",
        isApply: false,
        jobType: "scaffold_working_dir",
      },
      {
        plan_workflow_name: "plan",
        target_groups: [
          {
            target: "test/aws/",
            working_directory: "test/aws/",
            template_dir: "templates/aws",
          },
        ],
      },
    ),
  ).toStrictEqual(result);
});
