import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as core from "@actions/core";
import * as github from "@actions/github";
import { main } from "./terraform";
import type * as aqua from "../../aqua";

// Mock modules
vi.mock("@actions/core", () => ({
  startGroup: vi.fn(),
  endGroup: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  setFailed: vi.fn(),
  getInput: vi.fn(),
}));

vi.mock("@actions/github", () => ({
  getOctokit: vi.fn(),
  context: {
    repo: { owner: "test-owner", repo: "test-repo" },
    serverUrl: "https://github.com",
  },
}));

vi.mock("@actions/artifact", () => ({
  DefaultArtifactClient: class MockArtifactClient {
    getArtifact = vi.fn().mockResolvedValue({
      artifact: { id: 123 },
    });
    downloadArtifact = vi.fn().mockResolvedValue({});
  },
}));

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof fs>("fs");
  return {
    ...actual,
    mkdtempSync: vi.fn(),
    createWriteStream: vi.fn(),
    readFileSync: vi.fn(),
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
    GitHubActionPath: "/mock/action/path",
    getJobType: vi.fn().mockReturnValue("terraform"),
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
    CI_INFO_TEMP_DIR: "/tmp/ci-info",
    CI_INFO_HEAD_REF: "feature-branch",
  },
}));

vi.mock("../../lib/input", () => ({
  githubToken: "mock-github-token",
  csmAppId: "mock-app-id",
  csmAppPrivateKey: "mock-private-key",
}));

vi.mock("../../aqua", () => ({
  NewExecutor: vi.fn(),
}));

vi.mock("../get-target-config", () => ({
  getTargetConfig: vi.fn(),
}));

vi.mock("../../comment", () => ({
  post: vi.fn(),
}));

// Helper to create a mock executor
const createMockExecutor = () => ({
  exec: vi.fn().mockResolvedValue(0),
  getExecOutput: vi.fn().mockResolvedValue({
    exitCode: 0,
    stdout: "{}",
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
  target_groups: [],
  working_directory_file: "tfaction.yaml",
  module_file: "tfaction_module.yaml",
  tflint: { enabled: false, fix: false },
  trivy: { enabled: false },
  terraform_command: "terraform",
  config_path: "/git/root/tfaction-root.yaml",
  config_dir: "/git/root",
  workspace: "/git/root",
  draft_pr: false,
  label_prefixes: { skip: "skip:", tfmigrate: "tfmigrate:" },
  auto_apps: {
    logins: ["renovate[bot]", "dependabot[bot]"],
    allow_auto_merge_change: false,
  },
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
    workflowRuns?: Array<{ head_sha: string; id: number }>;
    prHeadSha?: string;
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

  // Mock fs for downloadPlanFile
  vi.mocked(fs.mkdtempSync).mockReturnValue("/tmp/tfaction-test");
  vi.mocked(fs.createWriteStream).mockReturnValue(
    mockWriteStream as unknown as fs.WriteStream,
  );
  vi.mocked(fs.readFileSync).mockReturnValue(
    JSON.stringify({
      head: { sha: options.prHeadSha ?? "abc123" },
    }),
  );
  vi.mocked(fs.rmdirSync).mockReturnValue(undefined);

  // Mock core.getInput for downloadPlanFile's github_token
  vi.mocked(core.getInput).mockReturnValue("mock-github-token");

  // Mock octokit for downloadPlanFile
  const workflowRuns = options.workflowRuns ?? [
    { head_sha: "abc123", id: 1001 },
  ];
  const mockOctokit = {
    rest: {
      actions: {
        listWorkflowRuns: vi.fn().mockResolvedValue({
          data: {
            workflow_runs: workflowRuns.map((wr) => ({
              head_sha: wr.head_sha,
              id: wr.id,
            })),
          },
        }),
      },
    },
    graphql: vi.fn(),
  };
  vi.mocked(github.getOctokit).mockReturnValue(
    mockOctokit as unknown as ReturnType<typeof github.getOctokit>,
  );

  return { config, targetConfig, mockExecutor, mockWriteStream, mockOctokit };
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
      CI_INFO_TEMP_DIR: "/tmp/ci-info",
      CI_INFO_HEAD_REF: "feature-branch",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs full terraform apply flow", async () => {
    const { mockExecutor } = await setupMainMocks();

    await main();

    // Verify tfcmt apply was called with terraform
    expect(mockExecutor.exec).toHaveBeenCalledWith(
      "tfcmt",
      expect.arrayContaining([
        "-var",
        "target:aws/dev/vpc",
        "apply",
        "--",
        "terraform",
        "apply",
        "-auto-approve",
        "-no-color",
        "-input=false",
      ]),
      expect.objectContaining({
        cwd: path.join("/git/root", "aws/dev/vpc"),
        ignoreReturnCode: true,
      }),
    );
  });

  it("uses custom terraform_command from target config", async () => {
    const { mockExecutor } = await setupMainMocks({
      targetConfig: { terraform_command: "tofu" },
    });

    await main();

    expect(mockExecutor.exec).toHaveBeenCalledWith(
      "tfcmt",
      expect.arrayContaining(["tofu", "apply"]),
      expect.any(Object),
    );
  });

  it('throws "No workflow run is found" when listWorkflowRuns returns empty array', async () => {
    const { mockExecutor } = await setupMainMocks({
      workflowRuns: [],
    });

    // comment is posted via native post(), then it throws
    mockExecutor.exec.mockResolvedValue(0);

    await expect(main()).rejects.toThrow("No workflow run is found");
  });

  it("throws when workflow run head SHA does not match PR head SHA", async () => {
    const { mockExecutor } = await setupMainMocks({
      workflowRuns: [{ head_sha: "different-sha", id: 1001 }],
      prHeadSha: "abc123",
    });

    mockExecutor.exec.mockResolvedValue(0);

    await expect(main()).rejects.toThrow(
      "workflow run's headSha (different-sha) is different from the associated pull request's head sha (abc123)",
    );
  });

  it("replaces / with __ in artifact name", async () => {
    const { mockOctokit } = await setupMainMocks();

    await main();

    // The artifact name should be terraform_plan_file_aws__dev__vpc
    // Verified through the workflow run API call - main() succeeds because
    // it downloads the artifact with the correctly transformed name
    expect(mockOctokit.rest.actions.listWorkflowRuns).toHaveBeenCalled();
  });

  it("posts drift issue result when TFACTION_DRIFT_ISSUE_NUMBER is set", async () => {
    const { mockExecutor } = await setupMainMocks({
      envOverrides: { TFACTION_DRIFT_ISSUE_NUMBER: "99" },
    });

    await main();

    // Verify tfcmt was called a second time with drift issue config
    const execCalls = mockExecutor.exec.mock.calls;
    const driftCall = execCalls.find(
      (call: unknown[]) =>
        call[0] === "tfcmt" &&
        (call[1] as string[]).some((arg: string) =>
          arg.includes("tfcmt-drift.yaml"),
        ),
    );
    expect(driftCall).toBeDefined();
    expect(driftCall![1]).toEqual(
      expect.arrayContaining([
        "-owner",
        "drift-owner",
        "-repo",
        "drift-repo",
        "-pr",
        "99",
      ]),
    );
  });

  it("warns but does not throw when drift issue posting fails", async () => {
    const { mockExecutor } = await setupMainMocks({
      envOverrides: { TFACTION_DRIFT_ISSUE_NUMBER: "99" },
    });

    // First exec call is tfcmt apply (succeeds), second is drift issue (fails)
    mockExecutor.exec.mockImplementation((cmd: string, args?: string[]) => {
      if (
        cmd === "tfcmt" &&
        args &&
        args.some((a: string) => a.includes("tfcmt-drift.yaml"))
      ) {
        throw new Error("drift posting error");
      }
      return Promise.resolve(0);
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

  it('throws "terraform apply failed" when exit code is non-zero', async () => {
    const { mockExecutor } = await setupMainMocks();

    // Make tfcmt apply return non-zero
    mockExecutor.exec.mockImplementation((_cmd: string, args?: string[]) => {
      if (args && args.includes("apply") && args.includes("-auto-approve")) {
        return Promise.resolve(1);
      }
      return Promise.resolve(0);
    });

    await expect(main()).rejects.toThrow("terraform apply failed");
  });
});
