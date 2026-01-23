import { run, Result } from "./index";
import * as lib from "../lib";
import * as env from "../lib/env";
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
