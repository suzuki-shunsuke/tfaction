import { run, Result } from "./run";

test("default", () => {
  const result: Result = {
    envs: new Map<string, any>(),
    outputs: new Map<string, any>([
      ["working_directory", "tests/aws/foo"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "templates/aws"],
      ["enable_tfsec", false],
      ["enable_tflint", true],
      ["enable_trivy", true],
      ["destroy", false],
      ["aws_region", "us-east-1"],
      ["terraform_command", "terraform"],
    ]),
  };
  expect(
    run(
      {
        target: "tests/aws/foo",
        workingDir: "",
        isApply: false,
        jobType: "terraform",
      },
      {
        plan_workflow_name: "plan",
        target_groups: [
          {
            target: "tests/aws/",
            working_directory: "tests/aws/",
            template_dir: "templates/aws",
          },
        ],
      },
    ),
  ).toStrictEqual(result);
});

test("config", () => {
  const result: Result = {
    envs: new Map<string, any>(),
    outputs: new Map<string, any>([
      ["working_directory", "tests/aws/foo"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "templates/aws"],
      ["enable_tfsec", true],
      ["enable_tflint", false],
      ["enable_trivy", false],
      ["terraform_command", "tofu"],
      ["destroy", false],
      ["aws_region", "us-east-1"],
    ]),
  };
  expect(
    run(
      {
        target: "tests/aws/foo",
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
            target: "tests/aws/",
            working_directory: "tests/aws/",
            template_dir: "templates/aws",
            aws_region: "ap-northeast-1",
          },
        ],
      },
    ),
  ).toStrictEqual(result);
});

test("scaffold_working_dir", () => {
  const result: Result = {
    envs: new Map<string, any>(),
    outputs: new Map<string, any>([
      ["working_directory", "tests/aws/foo"],
      [
        "providers_lock_opts",
        "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
      ],
      ["template_dir", "templates/aws"],
      ["enable_tfsec", false],
      ["enable_tflint", true],
      ["enable_trivy", true],
      ["terraform_command", "terraform"],
    ]),
  };
  expect(
    run(
      {
        target: "tests/aws/foo",
        workingDir: "",
        isApply: false,
        jobType: "scaffold_working_dir",
      },
      {
        plan_workflow_name: "plan",
        target_groups: [
          {
            target: "tests/aws/",
            working_directory: "tests/aws/",
            template_dir: "templates/aws",
          },
        ],
      },
    ),
  ).toStrictEqual(result);
});
