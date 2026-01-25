import { diffString } from "json-diff";
import * as env from "../lib/env";

export const main = async () => {
  // Compare outputs
  const testdata = [
    {
      name: "get-target-config",
      expected: {
        working_directory: "tests/aws/foo/dev",
        providers_lock_opts: "-platform=linux_amd64 -platform=darwin_amd64",
        template_dir: "tests/templates/github",
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
      convert: (data: Record<string, string>): Record<string, string> => {
        data.aws_role_session_name = "";
        return data;
      },
      actual: env.all.TARGET_CONFIG,
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
