import { describe, it, expect } from "vitest";
import { loadYaml } from "./yaml";

describe("loadYaml", () => {
  it("resolves merge keys", () => {
    // https://github.com/suzuki-shunsuke/tfaction/issues/4213
    const content = `
target_groups:
  - <<: &default
      aws_region: ap-northeast-1
      terraform_plan_config:
        aws_assume_role_arn: arn:aws:iam::123456789012:role/plan
    working_directory: aws/dev/
  - <<: *default
    working_directory: aws/prod/
`;
    expect(loadYaml(content)).toEqual({
      target_groups: [
        {
          aws_region: "ap-northeast-1",
          terraform_plan_config: {
            aws_assume_role_arn: "arn:aws:iam::123456789012:role/plan",
          },
          working_directory: "aws/dev/",
        },
        {
          aws_region: "ap-northeast-1",
          terraform_plan_config: {
            aws_assume_role_arn: "arn:aws:iam::123456789012:role/plan",
          },
          working_directory: "aws/prod/",
        },
      ],
    });
  });

  it("lets the merging map override merged fields", () => {
    const content = `
default: &default
  aws_region: ap-northeast-1
  destroy: false
target:
  <<: *default
  aws_region: us-east-1
`;
    expect(loadYaml(content)).toEqual({
      default: { aws_region: "ap-northeast-1", destroy: false },
      target: { aws_region: "us-east-1", destroy: false },
    });
  });

  it("resolves merge keys merging multiple maps", () => {
    const content = `
a: &a
  aws_region: ap-northeast-1
b: &b
  destroy: true
target:
  <<: [*a, *b]
`;
    expect(loadYaml(content)).toEqual({
      a: { aws_region: "ap-northeast-1" },
      b: { destroy: true },
      target: { aws_region: "ap-northeast-1", destroy: true },
    });
  });

  it("doesn't resolve YAML 1.1 specific types", () => {
    // js-yaml v4 didn't resolve them either, so the schema must not be
    // YAML11_SCHEMA.
    const content = `
enabled: yes
mode: 0700
`;
    expect(loadYaml(content)).toEqual({ enabled: "yes", mode: 700 });
  });
});
