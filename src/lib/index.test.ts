import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, it, expect, afterEach } from "vitest";
import {
  createWDTargetMap,
  getTargetFromTargetGroupsByWorkingDir,
  getJobConfig,
  setOutputs,
  setEnvs,
  getJobType,
  getTerraformCommand,
  isTofu,
} from "./index";
import { checkDriftDetectionEnabled } from "./drift";
import type { TargetGroup, TargetConfig, Config, Replace } from "./types";

describe("createWDTargetMap", () => {
  it("returns map with target equal to working_dir when no replace_target", () => {
    const wds = ["aws/foo/dev", "aws/bar/prod"];
    const targetGroups: TargetGroup[] = [
      {
        working_directory: "aws/**",
      },
    ];
    const result = createWDTargetMap(wds, targetGroups, undefined);
    expect(result.get("aws/foo/dev")).toBe("aws/foo/dev");
    expect(result.get("aws/bar/prod")).toBe("aws/bar/prod");
  });

  it("applies replace_target patterns", () => {
    const wds = ["aws/services/foo/dev"];
    const targetGroups: TargetGroup[] = [
      {
        working_directory: "aws/**",
      },
    ];
    const replaceTarget: Replace = {
      patterns: [
        {
          regexp: "^aws/services/",
          replace: "aws/",
        },
      ],
    };
    const result = createWDTargetMap(wds, targetGroups, replaceTarget);
    expect(result.get("aws/services/foo/dev")).toBe("aws/foo/dev");
  });

  it("applies multiple replace_target patterns in order", () => {
    const wds = ["aws/services/foo/dev"];
    const targetGroups: TargetGroup[] = [
      {
        working_directory: "aws/**",
      },
    ];
    const replaceTarget: Replace = {
      patterns: [
        {
          regexp: "services/",
          replace: "svc/",
        },
        {
          regexp: "^aws/svc/",
          replace: "cloud/",
        },
      ],
    };
    const result = createWDTargetMap(wds, targetGroups, replaceTarget);
    expect(result.get("aws/services/foo/dev")).toBe("cloud/foo/dev");
  });

  it("handles global flag in replace_target", () => {
    const wds = ["aws/foo/bar/foo/dev"];
    const targetGroups: TargetGroup[] = [
      {
        working_directory: "aws/**",
      },
    ];
    const replaceTarget: Replace = {
      patterns: [
        {
          regexp: "foo",
          replace: "baz",
          flags: "g",
        },
      ],
    };
    const result = createWDTargetMap(wds, targetGroups, replaceTarget);
    expect(result.get("aws/foo/bar/foo/dev")).toBe("aws/baz/bar/baz/dev");
  });

  it("does not apply replace for working_dir not matching any target group", () => {
    const wds = ["gcp/foo/dev"];
    const targetGroups: TargetGroup[] = [
      {
        working_directory: "aws/**",
      },
    ];
    const replaceTarget: Replace = {
      patterns: [
        {
          regexp: "gcp/",
          replace: "cloud/",
        },
      ],
    };
    const result = createWDTargetMap(wds, targetGroups, replaceTarget);
    // When no matching target group, the working_dir should remain unchanged
    expect(result.get("gcp/foo/dev")).toBe("gcp/foo/dev");
  });

  it("handles multiple target groups", () => {
    const wds = ["aws/foo/dev", "gcp/bar/prod"];
    const targetGroups: TargetGroup[] = [
      {
        working_directory: "aws/**",
      },
      {
        working_directory: "gcp/**",
      },
    ];
    const replaceTarget: Replace = {
      patterns: [
        {
          regexp: "/foo/",
          replace: "/replaced/",
        },
      ],
    };
    const result = createWDTargetMap(wds, targetGroups, replaceTarget);
    expect(result.get("aws/foo/dev")).toBe("aws/replaced/dev");
    expect(result.get("gcp/bar/prod")).toBe("gcp/bar/prod");
  });
});

describe("getTargetFromTargetGroupsByWorkingDir", () => {
  it("returns matching target group", () => {
    const targetGroups: TargetGroup[] = [
      {
        working_directory: "aws/**",
        aws_region: "us-east-1",
      },
    ];
    const result = getTargetFromTargetGroupsByWorkingDir(
      targetGroups,
      "aws/foo/dev",
    );
    expect(result).toEqual({
      working_directory: "aws/**",
      aws_region: "us-east-1",
    });
  });

  it("returns undefined when no match", () => {
    const targetGroups: TargetGroup[] = [
      {
        working_directory: "aws/**",
      },
    ];
    const result = getTargetFromTargetGroupsByWorkingDir(
      targetGroups,
      "gcp/foo/dev",
    );
    expect(result).toBeUndefined();
  });

  it("returns first matching target group when multiple match", () => {
    const targetGroups: TargetGroup[] = [
      {
        working_directory: "aws/**",
        aws_region: "us-east-1",
      },
      {
        working_directory: "aws/services/**",
        aws_region: "us-west-2",
      },
    ];
    // "aws/services/foo" matches "aws/**" first
    const result = getTargetFromTargetGroupsByWorkingDir(
      targetGroups,
      "aws/services/foo",
    );
    expect(result?.aws_region).toBe("us-east-1");
  });

  it("handles nested paths correctly", () => {
    const targetGroups: TargetGroup[] = [
      {
        working_directory: "aws/prod/**",
      },
      {
        working_directory: "aws/**",
      },
    ];
    // "aws/prod/foo" should match "aws/prod/**" first
    const result = getTargetFromTargetGroupsByWorkingDir(
      targetGroups,
      "aws/prod/foo",
    );
    expect(result?.working_directory).toBe("aws/prod/**");
  });

  it("does not match parent directories", () => {
    const targetGroups: TargetGroup[] = [
      {
        working_directory: "aws/foo/dev/**",
      },
    ];
    // "aws/foo" should not match "aws/foo/dev/**"
    const result = getTargetFromTargetGroupsByWorkingDir(
      targetGroups,
      "aws/foo",
    );
    expect(result).toBeUndefined();
  });

  it("matches exact working directory", () => {
    const targetGroups: TargetGroup[] = [
      {
        working_directory: "aws/foo",
      },
    ];
    const result = getTargetFromTargetGroupsByWorkingDir(
      targetGroups,
      "aws/foo",
    );
    expect(result?.working_directory).toBe("aws/foo");
  });

  it("matches single-level wildcard pattern", () => {
    const targetGroups: TargetGroup[] = [
      {
        working_directory: "aws/*/dev",
      },
    ];
    expect(
      getTargetFromTargetGroupsByWorkingDir(targetGroups, "aws/foo/dev"),
    ).toBeDefined();
    expect(
      getTargetFromTargetGroupsByWorkingDir(targetGroups, "aws/foo/bar/dev"),
    ).toBeUndefined();
  });

  it("matches globstar pattern", () => {
    const targetGroups: TargetGroup[] = [
      {
        working_directory: "**/prod",
      },
    ];
    expect(
      getTargetFromTargetGroupsByWorkingDir(targetGroups, "aws/prod"),
    ).toBeDefined();
    expect(
      getTargetFromTargetGroupsByWorkingDir(targetGroups, "gcp/services/prod"),
    ).toBeDefined();
  });

  it("matches brace expansion pattern", () => {
    const targetGroups: TargetGroup[] = [
      {
        working_directory: "aws/{foo,bar}/**",
      },
    ];
    expect(
      getTargetFromTargetGroupsByWorkingDir(targetGroups, "aws/foo/dev"),
    ).toBeDefined();
    expect(
      getTargetFromTargetGroupsByWorkingDir(targetGroups, "aws/bar/dev"),
    ).toBeDefined();
    expect(
      getTargetFromTargetGroupsByWorkingDir(targetGroups, "aws/baz/dev"),
    ).toBeUndefined();
  });
});

describe("getJobConfig", () => {
  const config: TargetConfig = {
    terraform_plan_config: {
      aws_assume_role_arn: "arn:aws:iam::123456789012:role/terraform-plan",
    },
    terraform_apply_config: {
      aws_assume_role_arn: "arn:aws:iam::123456789012:role/terraform-apply",
    },
    tfmigrate_plan_config: {
      aws_assume_role_arn: "arn:aws:iam::123456789012:role/tfmigrate-plan",
    },
    tfmigrate_apply_config: {
      aws_assume_role_arn: "arn:aws:iam::123456789012:role/tfmigrate-apply",
    },
  };

  it("returns undefined when config is undefined", () => {
    expect(getJobConfig(undefined, true, "terraform")).toBeUndefined();
  });

  it("returns terraform_plan_config for terraform plan", () => {
    const result = getJobConfig(config, false, "terraform");
    expect(result?.aws_assume_role_arn).toBe(
      "arn:aws:iam::123456789012:role/terraform-plan",
    );
  });

  it("returns terraform_apply_config for terraform apply", () => {
    const result = getJobConfig(config, true, "terraform");
    expect(result?.aws_assume_role_arn).toBe(
      "arn:aws:iam::123456789012:role/terraform-apply",
    );
  });

  it("returns tfmigrate_plan_config for tfmigrate plan", () => {
    const result = getJobConfig(config, false, "tfmigrate");
    expect(result?.aws_assume_role_arn).toBe(
      "arn:aws:iam::123456789012:role/tfmigrate-plan",
    );
  });

  it("returns tfmigrate_apply_config for tfmigrate apply", () => {
    const result = getJobConfig(config, true, "tfmigrate");
    expect(result?.aws_assume_role_arn).toBe(
      "arn:aws:iam::123456789012:role/tfmigrate-apply",
    );
  });

  it("returns undefined for scaffold_working_dir job type (plan)", () => {
    const result = getJobConfig(config, false, "scaffold_working_dir");
    expect(result).toBeUndefined();
  });

  it("returns undefined for scaffold_working_dir job type (apply)", () => {
    const result = getJobConfig(config, true, "scaffold_working_dir");
    expect(result).toBeUndefined();
  });

  it("returns undefined when specific config is not set", () => {
    const partialConfig: TargetConfig = {
      terraform_plan_config: {
        aws_assume_role_arn: "arn:aws:iam::123456789012:role/terraform-plan",
      },
    };
    expect(getJobConfig(partialConfig, true, "terraform")).toBeUndefined();
    expect(getJobConfig(partialConfig, false, "tfmigrate")).toBeUndefined();
    expect(getJobConfig(partialConfig, true, "tfmigrate")).toBeUndefined();
  });
});

describe("setOutputs", () => {
  it("returns empty map when keys is empty", () => {
    const result = setOutputs([], [{ foo: "bar" }]);
    expect(result.size).toBe(0);
  });

  it("returns empty map when objs is empty", () => {
    const result = setOutputs(["foo"], []);
    expect(result.size).toBe(0);
  });

  it("gets values from first object that has the key", () => {
    const obj1 = { foo: "first", bar: "bar1" };
    const obj2 = { foo: "second", baz: "baz2" };
    const result = setOutputs(["foo", "bar", "baz"], [obj1, obj2]);
    expect(result.get("foo")).toBe("first");
    expect(result.get("bar")).toBe("bar1");
    expect(result.get("baz")).toBe("baz2");
  });

  it("skips undefined values", () => {
    const obj1 = { foo: undefined };
    const obj2 = { foo: "second" };
    const result = setOutputs(["foo"], [obj1, obj2]);
    // Key exists in obj1 but value is undefined, so it should break and not continue to obj2
    expect(result.has("foo")).toBe(false);
  });

  it("handles undefined objects in array", () => {
    const obj1 = undefined;
    const obj2 = { foo: "second" };
    const result = setOutputs(["foo"], [obj1, obj2]);
    expect(result.get("foo")).toBe("second");
  });

  it("handles null objects in array", () => {
    const obj1 = null as unknown as object;
    const obj2 = { foo: "second" };
    const result = setOutputs(["foo"], [obj1, obj2]);
    expect(result.get("foo")).toBe("second");
  });

  it("does not include keys that are not found in any object", () => {
    const obj1 = { foo: "first" };
    const result = setOutputs(["foo", "missing"], [obj1]);
    expect(result.has("foo")).toBe(true);
    expect(result.has("missing")).toBe(false);
  });
});

describe("setEnvs", () => {
  it("returns empty map when no objects provided", () => {
    const result = setEnvs();
    expect(result.size).toBe(0);
  });

  it("returns empty map when all objects are undefined", () => {
    const result = setEnvs(undefined, undefined);
    expect(result.size).toBe(0);
  });

  it("returns empty map when objects have no env field", () => {
    const result = setEnvs({}, { other: "value" } as {
      env?: Record<string, string>;
    });
    expect(result.size).toBe(0);
  });

  it("collects env from single object", () => {
    const obj = {
      env: {
        FOO: "bar",
        BAZ: "qux",
      },
    };
    const result = setEnvs(obj);
    expect(result.get("FOO")).toBe("bar");
    expect(result.get("BAZ")).toBe("qux");
  });

  it("collects env from multiple objects", () => {
    const obj1 = {
      env: {
        FOO: "first",
      },
    };
    const obj2 = {
      env: {
        BAR: "second",
      },
    };
    const result = setEnvs(obj1, obj2);
    expect(result.get("FOO")).toBe("first");
    expect(result.get("BAR")).toBe("second");
  });

  it("later objects override earlier objects for same key", () => {
    const obj1 = {
      env: {
        FOO: "first",
      },
    };
    const obj2 = {
      env: {
        FOO: "second",
      },
    };
    const result = setEnvs(obj1, obj2);
    expect(result.get("FOO")).toBe("second");
  });

  it("skips undefined objects", () => {
    const obj1 = undefined;
    const obj2 = {
      env: {
        FOO: "value",
      },
    };
    const result = setEnvs(obj1, obj2);
    expect(result.get("FOO")).toBe("value");
  });
});

describe("checkDriftDetectionEnabled", () => {
  const createConfig = (driftDetection?: { enabled?: boolean }): Config =>
    ({
      drift_detection: driftDetection,
    }) as Config;

  const createTargetGroup = (driftDetection?: {
    enabled?: boolean;
  }): TargetGroup =>
    ({
      working_directory: "aws",
      drift_detection: driftDetection,
    }) as TargetGroup;

  const createTargetConfig = (driftDetection?: {
    enabled?: boolean;
  }): TargetConfig => ({
    drift_detection: driftDetection,
  });

  it("returns false when no drift_detection is set anywhere", () => {
    const cfg = createConfig(undefined);
    const targetGroup = createTargetGroup(undefined);
    const wdCfg = createTargetConfig(undefined);
    expect(checkDriftDetectionEnabled(cfg, targetGroup, wdCfg)).toBe(false);
  });

  it("uses wdCfg.drift_detection.enabled when set to true", () => {
    const cfg = createConfig({ enabled: false });
    const targetGroup = createTargetGroup({ enabled: false });
    const wdCfg = createTargetConfig({ enabled: true });
    expect(checkDriftDetectionEnabled(cfg, targetGroup, wdCfg)).toBe(true);
  });

  it("uses wdCfg.drift_detection.enabled when set to false", () => {
    const cfg = createConfig({ enabled: true });
    const targetGroup = createTargetGroup({ enabled: true });
    const wdCfg = createTargetConfig({ enabled: false });
    expect(checkDriftDetectionEnabled(cfg, targetGroup, wdCfg)).toBe(false);
  });

  it("defaults to true when wdCfg.drift_detection exists but enabled is undefined", () => {
    const cfg = createConfig({ enabled: false });
    const targetGroup = createTargetGroup({ enabled: false });
    const wdCfg = createTargetConfig({});
    expect(checkDriftDetectionEnabled(cfg, targetGroup, wdCfg)).toBe(true);
  });

  it("uses targetGroup.drift_detection.enabled when wdCfg has no drift_detection", () => {
    const cfg = createConfig({ enabled: false });
    const targetGroup = createTargetGroup({ enabled: true });
    const wdCfg = createTargetConfig(undefined);
    expect(checkDriftDetectionEnabled(cfg, targetGroup, wdCfg)).toBe(true);
  });

  it("defaults to true when targetGroup.drift_detection exists but enabled is undefined", () => {
    const cfg = createConfig({ enabled: false });
    const targetGroup = createTargetGroup({});
    const wdCfg = createTargetConfig(undefined);
    expect(checkDriftDetectionEnabled(cfg, targetGroup, wdCfg)).toBe(true);
  });

  it("uses cfg.drift_detection.enabled when wdCfg and targetGroup have no drift_detection", () => {
    const cfg = createConfig({ enabled: true });
    const targetGroup = createTargetGroup(undefined);
    const wdCfg = createTargetConfig(undefined);
    expect(checkDriftDetectionEnabled(cfg, targetGroup, wdCfg)).toBe(true);
  });

  it("returns false when cfg.drift_detection.enabled is false", () => {
    const cfg = createConfig({ enabled: false });
    const targetGroup = createTargetGroup(undefined);
    const wdCfg = createTargetConfig(undefined);
    expect(checkDriftDetectionEnabled(cfg, targetGroup, wdCfg)).toBe(false);
  });

  it("defaults to true when cfg.drift_detection exists but enabled is undefined", () => {
    const cfg = createConfig({});
    const targetGroup = createTargetGroup(undefined);
    const wdCfg = createTargetConfig(undefined);
    expect(checkDriftDetectionEnabled(cfg, targetGroup, wdCfg)).toBe(true);
  });

  it("handles undefined targetGroup", () => {
    const cfg = createConfig({ enabled: true });
    const wdCfg = createTargetConfig(undefined);
    expect(checkDriftDetectionEnabled(cfg, undefined, wdCfg)).toBe(true);
  });

  it("wdCfg takes priority over undefined targetGroup", () => {
    const cfg = createConfig({ enabled: false });
    const wdCfg = createTargetConfig({ enabled: true });
    expect(checkDriftDetectionEnabled(cfg, undefined, wdCfg)).toBe(true);
  });
});

describe("getJobType", () => {
  const originalEnv = process.env.TFACTION_JOB_TYPE;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.TFACTION_JOB_TYPE;
    } else {
      process.env.TFACTION_JOB_TYPE = originalEnv;
    }
  });

  it("throws when TFACTION_JOB_TYPE is not set", () => {
    delete process.env.TFACTION_JOB_TYPE;
    expect(() => getJobType()).toThrow(
      "environment variable TFACTION_JOB_TYPE is required",
    );
  });

  it("returns terraform when TFACTION_JOB_TYPE is terraform", () => {
    process.env.TFACTION_JOB_TYPE = "terraform";
    expect(getJobType()).toBe("terraform");
  });

  it("returns tfmigrate when TFACTION_JOB_TYPE is tfmigrate", () => {
    process.env.TFACTION_JOB_TYPE = "tfmigrate";
    expect(getJobType()).toBe("tfmigrate");
  });

  it("returns scaffold_working_dir when TFACTION_JOB_TYPE is scaffold_working_dir", () => {
    process.env.TFACTION_JOB_TYPE = "scaffold_working_dir";
    expect(getJobType()).toBe("scaffold_working_dir");
  });

  it("throws when TFACTION_JOB_TYPE is invalid", () => {
    process.env.TFACTION_JOB_TYPE = "invalid";
    expect(() => getJobType()).toThrow();
  });
});

describe("isTofu", () => {
  it.each([
    ["tofu", true],
    ["/usr/local/bin/tofu", true],
    ["tofu.exe", true],
    ["bin/tofu", true],
    ["terraform", false],
    ["terragrunt", false],
    ["/usr/local/bin/terraform", false],
    ["tofu-wrapper", false],
  ])("isTofu(%s) is %s", (command, expected) => {
    expect(isTofu(command)).toBe(expected);
  });
});

describe("getTerraformCommand", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  /** Creates files under a temporary git root and returns its path */
  const setup = (files: Record<string, string>): string => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "tfaction-test-"));
    dirs.push(root);
    for (const [name, content] of Object.entries(files)) {
      const p = path.join(root, name);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, content);
    }
    return root;
  };

  const newConfig = (
    root: string,
    targetGroups: TargetGroup[],
    terraformCommand = "terraform",
  ) => ({
    git_root_dir: root,
    working_directory_file: "tfaction.yaml",
    module_file: "tfaction_module.yaml",
    target_groups: targetGroups,
    terraform_command: terraformCommand,
  });

  it("prefers tfaction.yaml over target_groups and the root", () => {
    const root = setup({
      "aws/foo/tfaction.yaml": "terraform_command: tofu\n",
    });
    const config = newConfig(root, [
      { working_directory: "aws/**", terraform_command: "terraform" },
    ]);
    expect(getTerraformCommand(config, "aws/foo")).toBe("tofu");
  });

  it("prefers tfaction_module.yaml over tfaction.yaml", () => {
    const root = setup({
      "modules/vpc/tfaction_module.yaml": "terraform_command: tofu\n",
      "modules/vpc/tfaction.yaml": "terraform_command: terraform\n",
    });
    expect(getTerraformCommand(newConfig(root, []), "modules/vpc")).toBe(
      "tofu",
    );
  });

  it("uses target_groups when the file has no terraform_command", () => {
    const root = setup({ "aws/foo/tfaction.yaml": "{}\n" });
    const config = newConfig(
      root,
      [{ working_directory: "aws/**", terraform_command: "tofu" }],
      "terraform",
    );
    expect(getTerraformCommand(config, "aws/foo")).toBe("tofu");
  });

  it("uses the root when no target group matches", () => {
    const root = setup({ "other/foo/tfaction.yaml": "{}\n" });
    const config = newConfig(
      root,
      [{ working_directory: "aws/**", terraform_command: "terraform" }],
      "tofu",
    );
    expect(getTerraformCommand(config, "other/foo")).toBe("tofu");
  });

  it("ignores a file that can't be read", () => {
    const root = setup({ "aws/foo/tfaction.yaml": "" });
    const config = newConfig(
      root,
      [{ working_directory: "aws/**", terraform_command: "tofu" }],
      "terraform",
    );
    expect(getTerraformCommand(config, "aws/foo")).toBe("tofu");
  });

  it("ignores a file with an invalid field", () => {
    const root = setup({
      "aws/foo/tfaction.yaml": "terraform_command: [tofu]\n",
    });
    expect(getTerraformCommand(newConfig(root, [], "tofu"), "aws/foo")).toBe(
      "tofu",
    );
  });
});
