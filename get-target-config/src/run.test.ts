import { run, Result } from "./run";

test("default", () => {
    const result: Result = {
        envs: new Map<string, any>(),
        outputs: new Map<string, any>([
            ["working_directory", "tests/aws/foo"],
            ["providers_lock_opts", "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64"],
            ["template_dir", "templates/aws"],
            ["enable_tfsec", false],
            ["enable_tflint", true],
            ["enable_trivy", true],
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
