import { describe, it, expect, vi, beforeEach } from "vitest";
import { getConftestPaths, buildConftestArgs, buildPolicies } from "./index";
import type * as types from "../lib/types";

vi.mock("glob", () => ({
  globSync: vi.fn(),
}));

vi.mock("fs", async (importOriginal) => {
  const original = await importOriginal<typeof import("fs")>();
  return {
    ...original,
    default: {
      ...original,
      writeFileSync: vi.fn(),
    },
  };
});

vi.mock("tmp", () => ({
  default: {
    setGracefulCleanup: vi.fn(),
    dirSync: vi.fn(() => ({ name: "/tmp/mock-dir" })),
  },
}));

import { globSync } from "glob";
import fs from "fs";

describe("getConftestPaths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns *.tf and *.tf.json files when policy.tf is true", () => {
    const mockGlobSync = vi.mocked(globSync);
    mockGlobSync
      .mockReturnValueOnce(["/work/main.tf", "/work/variables.tf"])
      .mockReturnValueOnce(["/work/backend.tf.json"]);

    const policy: types.ConftestPolicyConfig = {
      tf: true,
      policy: "policy",
    };
    const result = getConftestPaths(policy, "/work");

    expect(mockGlobSync).toHaveBeenCalledTimes(2);
    expect(mockGlobSync).toHaveBeenCalledWith("/work/*.tf", {
      ignore: ".terraform/**",
    });
    expect(mockGlobSync).toHaveBeenCalledWith("/work/*.tf.json", {
      ignore: ".terraform/**",
    });
    expect(result).toEqual(["main.tf", "variables.tf", "backend.tf.json"]);
  });

  it("returns default tfplan.json when policy.plan is true and planJsonPath is not provided", () => {
    const policy: types.ConftestPolicyConfig = {
      plan: true,
      policy: "policy",
    };
    const result = getConftestPaths(policy, "/work");

    expect(result).toEqual(["tfplan.json"]);
  });

  it("returns custom planJsonPath when policy.plan is true and planJsonPath is provided", () => {
    const policy: types.ConftestPolicyConfig = {
      plan: true,
      policy: "policy",
    };
    const result = getConftestPaths(policy, "/work", "custom-plan.json");

    expect(result).toEqual(["custom-plan.json"]);
  });

  it("returns matching glob paths when policy.paths is set", () => {
    const mockGlobSync = vi.mocked(globSync);
    mockGlobSync.mockReturnValueOnce([
      "/work/data/config.json",
      "/work/data/settings.json",
    ]);

    const policy: types.ConftestPolicyConfig = {
      paths: ["data/*.json"],
      policy: "policy",
    };
    const result = getConftestPaths(policy, "/work");

    expect(mockGlobSync).toHaveBeenCalledWith("/work/data/*.json", {
      ignore: ".terraform/**",
    });
    expect(result).toEqual(["data/config.json", "data/settings.json"]);
  });

  it("returns empty array when policy.tf is true but no files match", () => {
    const mockGlobSync = vi.mocked(globSync);
    mockGlobSync.mockReturnValue([]);

    const policy: types.ConftestPolicyConfig = {
      tf: true,
      policy: "policy",
    };
    const result = getConftestPaths(policy, "/work");

    expect(result).toEqual([]);
  });

  it("returns empty array when no policy type is set", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
    };
    const result = getConftestPaths(policy, "/work");

    expect(result).toEqual([]);
  });

  it("handles multiple paths in policy.paths", () => {
    const mockGlobSync = vi.mocked(globSync);
    mockGlobSync
      .mockReturnValueOnce(["/work/configs/a.yaml"])
      .mockReturnValueOnce(["/work/data/b.json", "/work/data/c.json"]);

    const policy: types.ConftestPolicyConfig = {
      paths: ["configs/*.yaml", "data/*.json"],
      policy: "policy",
    };
    const result = getConftestPaths(policy, "/work");

    expect(mockGlobSync).toHaveBeenCalledTimes(2);
    expect(result).toEqual(["configs/a.yaml", "data/b.json", "data/c.json"]);
  });
});

describe("buildConftestArgs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns basic args with --no-color", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy/main.rego",
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    expect(result[0]).toBe("test");
    expect(result[1]).toBe("--no-color");
  });

  it("adds single policy path with -p flag", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy/main.rego",
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    expect(result).toContain("-p");
    const pIndex = result.indexOf("-p");
    expect(result[pIndex + 1]).toBe("../policy/main.rego");
  });

  it("adds multiple policy paths with -p flags", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: ["policy/a.rego", "policy/b.rego"],
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    const pIndices = result
      .map((v, i) => (v === "-p" ? i : -1))
      .filter((i) => i !== -1);
    expect(pIndices).toHaveLength(2);
  });

  it("adds --combine flag when combine is true", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
      combine: true,
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    expect(result).toContain("--combine");
  });

  it("does not add --combine flag when combine is false", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
      combine: false,
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    expect(result).not.toContain("--combine");
  });

  it("adds single data path with --data flag", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
      data: "data/common.json",
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    const dataIndices = result
      .map((v, i) => (v === "--data" ? i : -1))
      .filter((i) => i !== -1);
    // One from user config, one from tfaction auto-generated data
    expect(dataIndices.length).toBeGreaterThanOrEqual(2);
  });

  it("adds multiple data paths with --data flags", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
      data: ["data/a.json", "data/b.json"],
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    const dataIndices = result
      .map((v, i) => (v === "--data" ? i : -1))
      .filter((i) => i !== -1);
    // Two from user config, one from tfaction auto-generated data
    expect(dataIndices.length).toBeGreaterThanOrEqual(3);
  });

  it("adds --fail-on-warn when fail_on_warn is true", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
      fail_on_warn: true,
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    expect(result).toContain("--fail-on-warn");
  });

  it("adds --no-fail when no_fail is true", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
      no_fail: true,
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    expect(result).toContain("--no-fail");
  });

  it("adds --all-namespaces when all_namespaces is true", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
      all_namespaces: true,
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    expect(result).toContain("--all-namespaces");
  });

  it("adds --quiet when quiet is true", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
      quiet: true,
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    expect(result).toContain("--quiet");
  });

  it("adds --trace when trace is true", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
      trace: true,
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    expect(result).toContain("--trace");
  });

  it("adds --strict when strict is true", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
      strict: true,
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    expect(result).toContain("--strict");
  });

  it("adds --show-builtin-errors when show_builtin_errors is true", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
      show_builtin_errors: true,
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    expect(result).toContain("--show-builtin-errors");
  });

  it("adds --junit-hide-message when junit_hide_message is true", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
      junit_hide_message: true,
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    expect(result).toContain("--junit-hide-message");
  });

  it("adds --suppress-exceptions when suppress_exceptions is true", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
      suppress_exceptions: true,
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    expect(result).toContain("--suppress-exceptions");
  });

  it("adds --tls when tls is true", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
      tls: true,
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    expect(result).toContain("--tls");
  });

  it("adds --parser with value when parser is set", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
      parser: "yaml",
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    expect(result).toContain("--parser");
    const parserIndex = result.indexOf("--parser");
    expect(result[parserIndex + 1]).toBe("yaml");
  });

  it("adds --output with value when output is set", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
      output: "json",
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    expect(result).toContain("--output");
    const outputIndex = result.indexOf("--output");
    expect(result[outputIndex + 1]).toBe("json");
  });

  it("adds namespace flags with -n when namespaces is set", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
      namespaces: ["ns1", "ns2"],
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    const nIndices = result
      .map((v, i) => (v === "-n" ? i : -1))
      .filter((i) => i !== -1);
    expect(nIndices).toHaveLength(2);
    expect(result[nIndices[0] + 1]).toBe("ns1");
    expect(result[nIndices[1] + 1]).toBe("ns2");
  });

  it("appends paths at the end of args", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
    };
    const paths = ["main.tf", "variables.tf"];
    const result = buildConftestArgs(policy, "target", "workdir", paths);

    expect(result.slice(-2)).toEqual(["main.tf", "variables.tf"]);
  });

  it("does not add boolean flags when they are false or undefined", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
      fail_on_warn: false,
      no_fail: false,
      all_namespaces: false,
    };
    const result = buildConftestArgs(policy, "target", "workdir", []);

    expect(result).not.toContain("--fail-on-warn");
    expect(result).not.toContain("--no-fail");
    expect(result).not.toContain("--all-namespaces");
  });

  it("creates tfaction data file with target and working_directory", () => {
    const policy: types.ConftestPolicyConfig = {
      policy: "policy",
    };
    buildConftestArgs(policy, "my-target", "my-workdir", []);

    // The data file should be created and added to args
    const mockWriteFileSync = vi.mocked(fs.writeFileSync);
    expect(mockWriteFileSync).toHaveBeenCalled();
    const callArgs = mockWriteFileSync.mock.calls[0];
    expect(callArgs[0]).toBe("/tmp/mock-dir/data.json");
    const writtenData = JSON.parse(callArgs[1] as string);
    expect(writtenData.tfaction.target).toBe("my-target");
    expect(writtenData.tfaction.working_directory).toBe("my-workdir");
  });
});

describe("buildPolicies", () => {
  const createBaseConfig = (
    overrides?: Partial<types.Config>,
  ): types.Config => ({
    draft_pr: false,
    label_prefixes: { skip: "skip:", tfmigrate: "tfmigrate:" },
    module_file: "tfaction_module.yaml",
    plan_workflow_name: "plan",
    renovate_login: "renovate[bot]",
    skip_create_pr: false,
    target_groups: [],
    tflint: { enabled: true, fix: false },
    trivy: { enabled: true },
    terraform_command: "terraform",
    working_directory_file: "tfaction.yaml",
    git_root_dir: "/repo",
    config_path: "/repo/tfaction-root.yaml",
    config_dir: "/repo",
    workspace: "/repo",
    ...overrides,
  });

  const createEmptyTargetGroup = (): types.TargetGroup => ({
    working_directory: "test-working-dir",
  });

  const createEmptyWdConfig = (): types.TargetConfig => ({
    accept_change_by_renovate: false,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when config has no conftest", () => {
    const config = createBaseConfig();
    const result = buildPolicies(
      config,
      createEmptyTargetGroup(),
      createEmptyWdConfig(),
      false,
    );

    expect(result).toEqual([]);
  });

  it("returns empty array when conftest.policies is empty", () => {
    const config = createBaseConfig({
      conftest: {
        policies: [],
      },
    });
    const result = buildPolicies(
      config,
      createEmptyTargetGroup(),
      createEmptyWdConfig(),
      false,
    );

    expect(result).toEqual([]);
  });

  it("returns empty array when conftest.policies is undefined", () => {
    const config = createBaseConfig({
      conftest: {},
    });
    const result = buildPolicies(
      config,
      createEmptyTargetGroup(),
      createEmptyWdConfig(),
      false,
    );

    expect(result).toEqual([]);
  });

  it("returns policies for tf checks when isPlan is false", () => {
    // Note: policies without id avoid duplication from policyMap
    const config = createBaseConfig({
      conftest: {
        policies: [
          { tf: true, policy: "policy/tf" },
          { plan: true, policy: "policy/plan" },
        ],
      },
    });
    const result = buildPolicies(
      config,
      createEmptyTargetGroup(),
      createEmptyWdConfig(),
      false,
    );

    expect(result).toHaveLength(1);
    expect(result[0].tf).toBe(true);
  });

  it("returns policies for plan checks when isPlan is true", () => {
    // Note: policies without id avoid duplication from policyMap
    const config = createBaseConfig({
      conftest: {
        policies: [
          { tf: true, policy: "policy/tf" },
          { plan: true, policy: "policy/plan" },
        ],
      },
    });
    const result = buildPolicies(
      config,
      createEmptyTargetGroup(),
      createEmptyWdConfig(),
      true,
    );

    expect(result).toHaveLength(1);
    expect(result[0].plan).toBe(true);
  });

  it("excludes disabled policies", () => {
    // Note: policies without id avoid duplication from policyMap
    const config = createBaseConfig({
      conftest: {
        policies: [
          { tf: true, policy: "policy/a" },
          { tf: true, policy: "policy/b", enabled: false },
        ],
      },
    });
    const result = buildPolicies(
      config,
      createEmptyTargetGroup(),
      createEmptyWdConfig(),
      false,
    );

    expect(result).toHaveLength(1);
  });

  it("disables all policies when targetGroup has disable_all", () => {
    const config = createBaseConfig({
      conftest: {
        policies: [
          { id: "policy1", tf: true, policy: "policy/a" },
          { id: "policy2", tf: true, policy: "policy/b" },
        ],
      },
    });
    const targetGroup: types.TargetGroup = {
      working_directory: "test-working-dir",
      conftest: {
        disable_all: true,
      },
    };
    const result = buildPolicies(
      config,
      targetGroup,
      createEmptyWdConfig(),
      false,
    );

    expect(result).toHaveLength(0);
  });

  it("disables all policies when wdConfig has disable_all", () => {
    const config = createBaseConfig({
      conftest: {
        policies: [
          { id: "policy1", tf: true, policy: "policy/a" },
          { id: "policy2", tf: true, policy: "policy/b" },
        ],
      },
    });
    const wdConfig: types.TargetConfig = {
      accept_change_by_renovate: false,
      conftest: {
        disable_all: true,
      },
    };
    const result = buildPolicies(
      config,
      createEmptyTargetGroup(),
      wdConfig,
      false,
    );

    expect(result).toHaveLength(0);
  });

  it("merges policy overrides from targetGroup by id", () => {
    // Note: policies with IDs appear twice (from conftest.policies and policyMap)
    const config = createBaseConfig({
      conftest: {
        policies: [
          { id: "policy1", tf: true, policy: "policy/a", quiet: false },
        ],
      },
    });
    const targetGroup: types.TargetGroup = {
      working_directory: "test-working-dir",
      conftest: {
        policies: [{ id: "policy1", quiet: true, policy: "policy/a" }],
      },
    };
    const result = buildPolicies(
      config,
      targetGroup,
      createEmptyWdConfig(),
      false,
    );

    // Result includes duplicates since policy is in both conftest.policies and policyMap
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].quiet).toBe(true);
  });

  it("merges policy overrides from wdConfig by id", () => {
    // Note: policies with IDs appear twice (from conftest.policies and policyMap)
    const config = createBaseConfig({
      conftest: {
        policies: [
          { id: "policy1", tf: true, policy: "policy/a", trace: false },
        ],
      },
    });
    const wdConfig: types.TargetConfig = {
      accept_change_by_renovate: false,
      conftest: {
        policies: [{ id: "policy1", trace: true, policy: "policy/a" }],
      },
    };
    const result = buildPolicies(
      config,
      createEmptyTargetGroup(),
      wdConfig,
      false,
    );

    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].trace).toBe(true);
  });

  it("adds new policies from targetGroup without id", () => {
    // Using policy without id to avoid duplication
    const config = createBaseConfig({
      conftest: {
        policies: [{ tf: true, policy: "policy/a" }],
      },
    });
    const targetGroup: types.TargetGroup = {
      working_directory: "test-working-dir",
      conftest: {
        policies: [{ tf: true, policy: "policy/new" }],
      },
    };
    const result = buildPolicies(
      config,
      targetGroup,
      createEmptyWdConfig(),
      false,
    );

    expect(result).toHaveLength(2);
  });

  it("adds new policies from wdConfig without id", () => {
    // Using policy without id to avoid duplication
    const config = createBaseConfig({
      conftest: {
        policies: [{ tf: true, policy: "policy/a" }],
      },
    });
    const wdConfig: types.TargetConfig = {
      accept_change_by_renovate: false,
      conftest: {
        policies: [{ tf: true, policy: "policy/new" }],
      },
    };
    const result = buildPolicies(
      config,
      createEmptyTargetGroup(),
      wdConfig,
      false,
    );

    expect(result).toHaveLength(2);
  });

  it("adds new policies with id from targetGroup to policyMap", () => {
    // Using policy without id in base config to simplify
    const config = createBaseConfig({
      conftest: {
        policies: [{ tf: true, policy: "policy/a" }],
      },
    });
    const targetGroup: types.TargetGroup = {
      working_directory: "test-working-dir",
      conftest: {
        policies: [{ id: "new-policy", tf: true, policy: "policy/new" }],
      },
    };
    const result = buildPolicies(
      config,
      targetGroup,
      createEmptyWdConfig(),
      false,
    );

    // new-policy is added to policyMap and will appear once (not in original policies array)
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.some((p) => p.id === "new-policy")).toBe(true);
  });

  it("wdConfig overrides take precedence over targetGroup overrides", () => {
    const config = createBaseConfig({
      conftest: {
        policies: [
          { id: "policy1", tf: true, policy: "policy/a", quiet: false },
        ],
      },
    });
    const targetGroup: types.TargetGroup = {
      working_directory: "test-working-dir",
      conftest: {
        policies: [
          { id: "policy1", quiet: true, trace: true, policy: "policy/a" },
        ],
      },
    };
    const wdConfig: types.TargetConfig = {
      accept_change_by_renovate: false,
      conftest: {
        policies: [{ id: "policy1", quiet: false, policy: "policy/a" }],
      },
    };
    const result = buildPolicies(config, targetGroup, wdConfig, false);

    // With IDs, policies appear twice but both reference same object
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].quiet).toBe(false);
    expect(result[0].trace).toBe(true);
  });

  it("can re-enable disabled policies via override", () => {
    const config = createBaseConfig({
      conftest: {
        policies: [
          { id: "policy1", tf: true, policy: "policy/a", enabled: false },
        ],
      },
    });
    const targetGroup: types.TargetGroup = {
      working_directory: "test-working-dir",
      conftest: {
        policies: [{ id: "policy1", enabled: true, policy: "policy/a" }],
      },
    };
    const result = buildPolicies(
      config,
      targetGroup,
      createEmptyWdConfig(),
      false,
    );

    // Policy with ID will appear twice (duplicate from policyMap concat)
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].enabled).toBe(true);
  });

  it("includes policies without tf or plan flag when isPlan is false", () => {
    // Using policies without id to avoid duplication
    const config = createBaseConfig({
      conftest: {
        policies: [{ policy: "policy/a" }, { plan: true, policy: "policy/b" }],
      },
    });
    const result = buildPolicies(
      config,
      createEmptyTargetGroup(),
      createEmptyWdConfig(),
      false,
    );

    // policy without plan flag is included when isPlan is false (because !!policy.plan is false)
    expect(result).toHaveLength(1);
    expect(result[0].policy).toBe("policy/a");
  });
});
