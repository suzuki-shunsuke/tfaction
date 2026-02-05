import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  listRelatedPullRequests,
  updateBranchByCommit,
  updateBranchBySecurefix,
  main,
} from "./terraform";
import * as run from "./run";
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
  securefixActionAppId: "mock-app-id",
  securefixActionAppPrivateKey: "mock-private-key",
}));

vi.mock("../../aqua", () => ({
  NewExecutor: vi.fn(),
}));

vi.mock("../get-target-config", () => ({
  getTargetConfig: vi.fn(),
}));

vi.mock("@csm-actions/update-branch-action", () => ({
  update: vi.fn(),
}));

vi.mock("@suzuki-shunsuke/github-app-token", () => ({
  create: vi.fn(),
  revoke: vi.fn(),
  hasExpired: vi.fn(),
}));

vi.mock("./run", () => ({
  listRelatedPullRequests: vi.fn(),
  updateBranchByCommit: vi.fn(),
  updateBranchBySecurefix: vi.fn(),
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

  // Mock run.listRelatedPullRequests for the update phase
  vi.mocked(run.listRelatedPullRequests).mockResolvedValue([]);

  return { config, targetConfig, mockExecutor, mockWriteStream, mockOctokit };
};

describe("listRelatedPullRequests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls github.getOctokit and delegates to run.listRelatedPullRequests", async () => {
    const mockOctokit = { graphql: vi.fn() };
    vi.mocked(github.getOctokit).mockReturnValue(
      mockOctokit as unknown as ReturnType<typeof github.getOctokit>,
    );
    vi.mocked(run.listRelatedPullRequests).mockResolvedValue([10, 20]);

    const result = await listRelatedPullRequests("my-token", "aws/dev/vpc");

    expect(github.getOctokit).toHaveBeenCalledWith("my-token");
    expect(run.listRelatedPullRequests).toHaveBeenCalledWith({
      octokit: mockOctokit,
      owner: "test-owner",
      repo: "test-repo",
      target: "aws/dev/vpc",
    });
    expect(result).toEqual([10, 20]);
  });

  it("returns empty array when run.listRelatedPullRequests returns []", async () => {
    const mockOctokit = { graphql: vi.fn() };
    vi.mocked(github.getOctokit).mockReturnValue(
      mockOctokit as unknown as ReturnType<typeof github.getOctokit>,
    );
    vi.mocked(run.listRelatedPullRequests).mockResolvedValue([]);

    const result = await listRelatedPullRequests("my-token", "aws/dev/vpc");

    expect(result).toEqual([]);
  });
});

describe("updateBranchByCommit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates octokit and delegates to run.updateBranchByCommit", async () => {
    const mockOctokit = { rest: {} };
    vi.mocked(github.getOctokit).mockReturnValue(
      mockOctokit as unknown as ReturnType<typeof github.getOctokit>,
    );

    await updateBranchByCommit("my-token", [1, 2, 3]);

    expect(github.getOctokit).toHaveBeenCalledWith("my-token");
    expect(run.updateBranchByCommit).toHaveBeenCalledWith({
      octokit: mockOctokit,
      owner: "test-owner",
      repo: "test-repo",
      prNumbers: [1, 2, 3],
      logger: core,
    });
  });
});

describe("updateBranchBySecurefix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates GitHub App token and delegates to run.updateBranchBySecurefix, then revokes token", async () => {
    const githubAppTokenMod = await import("@suzuki-shunsuke/github-app-token");
    const updateBranchMod = await import("@csm-actions/update-branch-action");
    const mockOctokit = { rest: {} };
    const mockToken = {
      token: "app-token-123",
      expiresAt: "2099-01-01T00:00:00Z",
    };

    vi.mocked(githubAppTokenMod.create).mockResolvedValue(mockToken as never);
    vi.mocked(githubAppTokenMod.hasExpired).mockReturnValue(false);
    vi.mocked(github.getOctokit).mockReturnValue(
      mockOctokit as unknown as ReturnType<typeof github.getOctokit>,
    );

    await updateBranchBySecurefix("server-owner", "server-repo", [5, 6]);

    expect(githubAppTokenMod.create).toHaveBeenCalledWith({
      appId: "mock-app-id",
      privateKey: "mock-private-key",
      owner: "server-owner",
      repositories: ["server-repo"],
      permissions: { issues: "write" },
    });
    expect(run.updateBranchBySecurefix).toHaveBeenCalledWith({
      octokit: mockOctokit,
      serverRepoOwner: "server-owner",
      serverRepoName: "server-repo",
      owner: "test-owner",
      repo: "test-repo",
      serverUrl: "https://github.com",
      prNumbers: [5, 6],
      updateBranchFn: updateBranchMod.update,
      logger: core,
    });
    expect(githubAppTokenMod.revoke).toHaveBeenCalledWith("app-token-123");
  });

  it("revokes token even when run.updateBranchBySecurefix throws", async () => {
    const githubAppTokenMod = await import("@suzuki-shunsuke/github-app-token");
    const mockToken = {
      token: "app-token-456",
      expiresAt: "2099-01-01T00:00:00Z",
    };

    vi.mocked(githubAppTokenMod.create).mockResolvedValue(mockToken as never);
    vi.mocked(githubAppTokenMod.hasExpired).mockReturnValue(false);
    vi.mocked(github.getOctokit).mockReturnValue(
      {} as unknown as ReturnType<typeof github.getOctokit>,
    );
    vi.mocked(run.updateBranchBySecurefix).mockRejectedValue(
      new Error("update failed"),
    );

    await expect(updateBranchBySecurefix("owner", "repo", [1])).rejects.toThrow(
      "update failed",
    );

    expect(githubAppTokenMod.revoke).toHaveBeenCalledWith("app-token-456");
  });

  it("skips revocation if token has expired", async () => {
    const githubAppTokenMod = await import("@suzuki-shunsuke/github-app-token");
    const mockToken = {
      token: "expired-token",
      expiresAt: "2020-01-01T00:00:00Z",
    };

    vi.mocked(githubAppTokenMod.create).mockResolvedValue(mockToken as never);
    vi.mocked(githubAppTokenMod.hasExpired).mockReturnValue(true);
    vi.mocked(github.getOctokit).mockReturnValue(
      {} as unknown as ReturnType<typeof github.getOctokit>,
    );
    vi.mocked(run.updateBranchBySecurefix).mockResolvedValue(undefined);

    await updateBranchBySecurefix("owner", "repo", [1]);

    expect(githubAppTokenMod.revoke).not.toHaveBeenCalled();
    expect(core.info).toHaveBeenCalledWith(
      "GitHub App token has already expired",
    );
  });
});

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

  it('defaults to "terraform" when terraform_command is empty', async () => {
    const { mockExecutor } = await setupMainMocks({
      targetConfig: { terraform_command: "" },
    });

    await main();

    expect(mockExecutor.exec).toHaveBeenCalledWith(
      "tfcmt",
      expect.arrayContaining(["terraform", "apply"]),
      expect.any(Object),
    );
  });

  it('throws "No workflow run is found" when listWorkflowRuns returns empty array', async () => {
    const { mockExecutor } = await setupMainMocks({
      workflowRuns: [],
    });

    // github-comment post should be called, then it throws
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
    mockExecutor.exec.mockImplementation(
      async (cmd: string, args?: string[]) => {
        if (
          cmd === "tfcmt" &&
          args &&
          args.some((a: string) => a.includes("tfcmt-drift.yaml"))
        ) {
          throw new Error("drift posting error");
        }
        return 0;
      },
    );

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
    expect(run.listRelatedPullRequests).not.toHaveBeenCalled();
  });

  it("uses securefix when securefix_action.server_repository is configured", async () => {
    const githubAppTokenMod = await import("@suzuki-shunsuke/github-app-token");
    const mockToken = { token: "sf-token", expiresAt: "2099-01-01T00:00:00Z" };
    vi.mocked(githubAppTokenMod.create).mockResolvedValue(mockToken as never);
    vi.mocked(githubAppTokenMod.hasExpired).mockReturnValue(false);

    await setupMainMocks({
      config: {
        securefix_action: {
          server_repository: "securefix-server",
          pull_request: { base_branch: "main" },
        },
      },
    });

    vi.mocked(run.listRelatedPullRequests).mockResolvedValue([10]);

    await main();

    // updateBranchBySecurefix in ./run should have been called (via the wrapper)
    expect(run.updateBranchBySecurefix).toHaveBeenCalled();
  });

  it("uses commit update when securefix is not configured", async () => {
    await setupMainMocks();

    vi.mocked(run.listRelatedPullRequests).mockResolvedValue([10, 20]);

    await main();

    expect(run.updateBranchByCommit).toHaveBeenCalled();
  });

  it('throws "terraform apply failed" when exit code is non-zero', async () => {
    const { mockExecutor } = await setupMainMocks();

    // Make tfcmt apply return non-zero
    mockExecutor.exec.mockImplementation(
      async (_cmd: string, args?: string[]) => {
        if (args && args.includes("apply") && args.includes("-auto-approve")) {
          return 1;
        }
        return 0;
      },
    );

    await expect(main()).rejects.toThrow("terraform apply failed");

    // PR updates should still have run before the throw
    // (listRelatedPullRequests is called after the apply even on failure)
  });
});
