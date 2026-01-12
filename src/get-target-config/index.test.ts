import { run, Result } from "./index";
import * as lib from "../lib";
import { expect, test } from "vitest";

test("default", async () => {
  const runID = process.env.GITHUB_RUN_ID ?? "";
  const result: Result = {
    envs: new Map<string, any>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "aws/foo/dev"],
    ]),
    outputs: new Map<string, any>([
      ["working_directory", "tests/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "tests/templates/aws"],
      ["aws_role_session_name", "tfaction-plan-aws_foo_dev-" + runID],
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
        target: "aws/foo/dev",
        workingDir: "aws/foo/dev",
        isApply: false,
        jobType: "terraform",
      },
      lib.applyConfigDefaults(
        {
          plan_workflow_name: "plan.yaml",
          target_groups: [
            {
              working_directory: "aws",
              template_dir: "templates/aws",
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
    envs: new Map<string, any>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "aws/foo/dev"],
    ]),
    outputs: new Map<string, any>([
      ["working_directory", "tests/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "tests/templates/aws"],
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
        target: "aws/foo/dev",
        workingDir: "aws/foo/dev",
        isApply: false,
        jobType: "terraform",
      },
      lib.applyConfigDefaults(
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
              working_directory: "aws/",
              template_dir: "templates/aws",
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
    envs: new Map<string, any>([
      ["TFACTION_WORKING_DIR", "tests/aws/foo/dev"],
      ["TFACTION_TARGET", "aws/foo/dev"],
    ]),
    outputs: new Map<string, any>([
      ["working_directory", "tests/aws/foo/dev"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "tests/templates/aws"],
      ["enable_tflint", true],
      ["enable_trivy", true],
      ["tflint_fix", false],
      ["terraform_command", "terraform"],
    ]),
  };
  expect(
    await run(
      {
        target: "aws/foo/dev",
        workingDir: "aws/foo/dev",
        isApply: false,
        jobType: "scaffold_working_dir",
      },
      lib.applyConfigDefaults(
        {
          plan_workflow_name: "plan.yaml",
          target_groups: [
            {
              working_directory: "aws/",
              template_dir: "templates/aws",
            },
          ],
        },
        "tests/tfaction-root.yaml",
      ),
    ),
  ).toStrictEqual(result);
});
