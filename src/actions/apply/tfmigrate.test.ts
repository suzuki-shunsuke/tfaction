import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as core from "@actions/core";

import { main } from "./tfmigrate";
import * as terraform from "./terraform";
import type * as aqua from "../../aqua";

// Mock modules
vi.mock("@actions/core", () => ({
  startGroup: vi.fn(),
  endGroup: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}));

vi.mock("@actions/github", () => ({
  context: {
    repo: { owner: "test-owner", repo: "test-repo" },
    serverUrl: "https://github.com",
  },
}));

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof fs>("fs");
  return {
    ...actual,
    mkdtempSync: vi.fn(),
    createWriteStream: vi.fn(),
    rmdirSync: vi.fn(),
  };
});

vi.mock("os", async () => {
  const actual = await vi.importActual<typeof os>("os");
  return {
    ...actual,
    tmpdir: vi.fn().mockReturnValue("/tmp"),
  };
});

vi.mock("../../lib", async () => {
  const actual = await vi.importActual("../../lib");
  return {
    ...actual,
    getConfig: vi.fn(),
    getJobType: vi.fn().mockReturnValue("tfmigrate"),
  };
});

vi.mock("../../lib/drift", () => ({
  getDriftIssueRepo: vi.fn().mockReturnValue({
    owner: "drift-owner",
    name: "drift-repo",
  }),
}));

vi.mock("../../lib/env", () => ({
  all: {
    TFACTION_TARGET: "aws/dev/vpc",
    TFACTION_WORKING_DIR: "aws/dev/vpc",
    TFACTION_DRIFT_ISSUE_NUMBER: "",
    CI_INFO_PR_NUMBER: "42",
  },
}));

vi.mock("../../lib/input", () => ({
  githubToken: "mock-github-token",
}));

vi.mock("../../aqua", () => ({
  NewExecutor: vi.fn(),
}));

vi.mock("../get-target-config", () => ({
  getTargetConfig: vi.fn(),
}));

vi.mock("./terraform", () => ({
  listRelatedPullRequests: vi.fn(),
  updateBranchBySecurefix: vi.fn(),
  updateBranchByCommit: vi.fn(),
}));

// Helper to create a mock executor
const createMockExecutor = () => ({
  exec: vi.fn().mockResolvedValue(0),
  getExecOutput: vi.fn().mockResolvedValue({
    exitCode: 0,
    stdout: "",
    stderr: "",
  }),
  installDir: "/mock/install",
  githubToken: "mock-token",
  env: vi.fn(),
  buildArgs: vi.fn(),
});

// Helper to create a mock write stream
const createMockWriteStream = () => ({
  write: vi.fn(),
  end: vi.fn(),
});

// Helper to create a mock config
const createMockConfig = (overrides: Record<string, unknown> = {}) => ({
  git_root_dir: "/git/root",
  plan_workflow_name: "plan.yaml",
  update_related_pull_requests: { enabled: true },
  target_groups: [],
  working_directory_file: "tfaction.yaml",
  tflint: { enabled: false, fix: false },
  trivy: { enabled: false },
  terraform_command: "terraform",
  config_path: "/git/root/tfaction-root.yaml",
  config_dir: "/git/root",
  workspace: "/git/root",
  draft_pr: false,
  label_prefixes: { skip: "skip:", tfmigrate: "tfmigrate:" },
  module_file: "tfaction_module.yaml",
  renovate_login: "renovate[bot]",
  skip_create_pr: false,
  ...overrides,
});

// Helper to create a mock target config
const createMockTargetConfig = (overrides: Record<string, unknown> = {}) => ({
  working_directory: "aws/dev/vpc",
  target: "aws/dev/vpc",
  providers_lock_opts: "",
  enable_tflint: false,
  enable_trivy: false,
  tflint_fix: false,
  terraform_command: "terraform",
  ...overrides,
});

// Helper to set up all mocks for main() tests
const setupMainMocks = async (
  options: {
    config?: Record<string, unknown>;
    targetConfig?: Record<string, unknown>;
    envOverrides?: Record<string, string>;
  } = {},
) => {
  const lib = await import("../../lib");
  const aquaMod = await import("../../aqua");
  const getTargetConfigMod = await import("../get-target-config");
  const envMod = await import("../../lib/env");

  const config = createMockConfig(options.config ?? {});
  const targetConfig = createMockTargetConfig(options.targetConfig ?? {});
  const mockExecutor = createMockExecutor();
  const mockWriteStream = createMockWriteStream();

  vi.mocked(lib.getConfig).mockResolvedValue(config as never);
  vi.mocked(getTargetConfigMod.getTargetConfig).mockResolvedValue(
    targetConfig as never,
  );
  vi.mocked(aquaMod.NewExecutor).mockResolvedValue(
    mockExecutor as unknown as aqua.Executor,
  );

  // Apply env overrides
  if (options.envOverrides) {
    Object.assign(envMod.all, options.envOverrides);
  }

  // Mock fs
  vi.mocked(fs.mkdtempSync).mockReturnValue("/tmp/tfaction-test");
  vi.mocked(fs.createWriteStream).mockReturnValue(
    mockWriteStream as unknown as fs.WriteStream,
  );
  vi.mocked(fs.rmdirSync).mockReturnValue(undefined);

  // Mock listRelatedPullRequests for the update phase
  vi.mocked(terraform.listRelatedPullRequests).mockResolvedValue([]);

  return { config, targetConfig, mockExecutor, mockWriteStream };
};

describe("main", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset env mocks to defaults
    const envMod = await import("../../lib/env");
    Object.assign(envMod.all, {
      TFACTION_TARGET: "aws/dev/vpc",
      TFACTION_WORKING_DIR: "aws/dev/vpc",
      TFACTION_DRIFT_ISSUE_NUMBER: "",
      CI_INFO_PR_NUMBER: "42",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs tfmigrate apply with correct arguments", async () => {
    const { mockExecutor } = await setupMainMocks();

    await main();

    expect(mockExecutor.exec).toHaveBeenCalledWith(
      "tfmigrate",
      ["apply"],
      expect.objectContaining({
        cwd: path.join("/git/root", "aws/dev/vpc"),
        ignoreReturnCode: true,
        comment: expect.objectContaining({
          token: "mock-github-token",
          key: "tfmigrate-apply",
          vars: { tfaction_target: "aws/dev/vpc" },
        }),
      }),
    );
  });

  it("passes TFMIGRATE_EXEC_PATH env when set", async () => {
    const { mockExecutor } = await setupMainMocks({
      envOverrides: { TFMIGRATE_EXEC_PATH: "/usr/local/bin/terraform" },
    });

    await main();

    expect(mockExecutor.exec).toHaveBeenCalledWith(
      "tfmigrate",
      ["apply"],
      expect.objectContaining({
        env: { TFMIGRATE_EXEC_PATH: "/usr/local/bin/terraform" },
      }),
    );
  });

  it("posts drift issue result when TFACTION_DRIFT_ISSUE_NUMBER is set", async () => {
    const { mockExecutor } = await setupMainMocks({
      envOverrides: { TFACTION_DRIFT_ISSUE_NUMBER: "99" },
    });

    await main();

    // Find the bash call for drift issue posting
    const execCalls = mockExecutor.exec.mock.calls;
    const driftCall = execCalls.find((call: unknown[]) => call[0] === "bash");
    expect(driftCall).toBeDefined();
    expect(driftCall![2]).toEqual(
      expect.objectContaining({
        cwd: path.join("/git/root", "aws/dev/vpc"),
        ignoreReturnCode: true,
        comment: expect.objectContaining({
          token: "mock-github-token",
          key: "drift-apply",
          org: "drift-owner",
          repo: "drift-repo",
          pr: "99",
          vars: expect.objectContaining({
            tfaction_target: "aws/dev/vpc",
          }),
        }),
      }),
    );
  });

  it("warns but does not throw when drift issue posting fails", async () => {
    const { mockExecutor } = await setupMainMocks({
      envOverrides: { TFACTION_DRIFT_ISSUE_NUMBER: "99" },
    });

    // First exec call is tfmigrate apply (succeeds), second is drift issue (fails)
    mockExecutor.exec.mockImplementation(async (cmd: string) => {
      if (cmd === "bash") {
        throw new Error("drift posting error");
      }
      return 0;
    });

    // Should not throw
    await main();

    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining("Failed to post to drift issue"),
    );
  });

  it("does not throw when temp directory removal fails", async () => {
    await setupMainMocks();

    vi.mocked(fs.rmdirSync).mockImplementation(() => {
      throw new Error("ENOTEMPTY");
    });

    // Should not throw
    await main();
  });

  it("skips updating when update_related_pull_requests.enabled is false", async () => {
    await setupMainMocks({
      config: { update_related_pull_requests: { enabled: false } },
    });

    await main();

    expect(core.info).toHaveBeenCalledWith(
      "Skip updating related pull requests",
    );
    expect(terraform.listRelatedPullRequests).not.toHaveBeenCalled();
  });

  it("uses securefix when securefix_action.server_repository is configured", async () => {
    await setupMainMocks({
      config: {
        securefix_action: {
          server_repository: "securefix-server",
        },
      },
    });

    vi.mocked(terraform.listRelatedPullRequests).mockResolvedValue([10]);

    await main();

    expect(terraform.updateBranchBySecurefix).toHaveBeenCalledWith(
      "test-owner",
      "securefix-server",
      [10],
    );
  });

  it("uses commit update when securefix is not configured", async () => {
    await setupMainMocks();

    vi.mocked(terraform.listRelatedPullRequests).mockResolvedValue([10, 20]);

    await main();

    expect(terraform.updateBranchByCommit).toHaveBeenCalledWith(
      "mock-github-token",
      [10, 20],
    );
  });

  it('throws "tfmigrate apply failed" when exit code is non-zero', async () => {
    const { mockExecutor } = await setupMainMocks();

    // Make tfmigrate apply return non-zero
    mockExecutor.exec.mockResolvedValue(1);

    await expect(main()).rejects.toThrow("tfmigrate apply failed");
  });
});
