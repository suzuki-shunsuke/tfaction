import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import { isPullRequestEvent, run, type RunInput } from "./run";
import type * as aqua from "../../aqua";

vi.mock("@actions/core", () => ({
  startGroup: vi.fn(),
  endGroup: vi.fn(),
}));

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof fs>("fs");
  return {
    ...actual,
    existsSync: vi.fn(),
  };
});

vi.mock("../../lib/git", () => ({
  hasFileChanged: vi.fn(),
}));

vi.mock("../../commit", () => ({
  create: vi.fn(),
}));

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

type MockExecutor = ReturnType<typeof createMockExecutor>;

const createBaseInput = (executor: MockExecutor): RunInput => ({
  isPullRequest: false,
  workingDir: "/test/working/dir",
  tfCommand: "terraform",
  providersLockOpts:
    "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
  githubToken: "test-token",
  workspace: "/github/workspace",
  gitRootDir: "/github/workspace",
  terragruntRunAvailable: false,
  executor: executor as unknown as aqua.Executor,
  serverRepository: "",
  appId: "",
  appPrivateKey: "",
});

describe("isPullRequestEvent", () => {
  it("returns true for pull_request", () => {
    expect(isPullRequestEvent("pull_request")).toBe(true);
  });

  it("returns true for pull_request_target", () => {
    expect(isPullRequestEvent("pull_request_target")).toBe(true);
  });

  it("returns false for push", () => {
    expect(isPullRequestEvent("push")).toBe(false);
  });

  it("returns false for schedule", () => {
    expect(isPullRequestEvent("schedule")).toBe(false);
  });
});

describe("run", () => {
  let mockExecutor: MockExecutor;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecutor = createMockExecutor();
  });

  it("non-PR: calls init with comment and providers", async () => {
    const input = createBaseInput(mockExecutor);

    await run(input);

    expect(mockExecutor.exec).toHaveBeenCalledTimes(2);
    // init with comment
    expect(mockExecutor.exec).toHaveBeenNthCalledWith(
      1,
      "terraform",
      ["init", "-input=false"],
      expect.objectContaining({
        cwd: "/test/working/dir",
        comment: { token: "test-token" },
      }),
    );
    // providers
    expect(mockExecutor.exec).toHaveBeenNthCalledWith(
      2,
      "terraform",
      ["providers"],
      expect.objectContaining({
        cwd: "/test/working/dir",
        group: "terraform providers",
      }),
    );
  });

  it("PR, init succeeds, lock not changed: init + providers lock + providers, no commit", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const gitMod = await import("../../lib/git");
    vi.mocked(gitMod.hasFileChanged).mockResolvedValue(false);
    const commitMod = await import("../../commit");

    const input = {
      ...createBaseInput(mockExecutor),
      isPullRequest: true,
    };

    await run(input);

    // init + providers lock + providers = 3 exec calls
    expect(mockExecutor.exec).toHaveBeenCalledTimes(3);
    // init (no comment, ignoreReturnCode)
    expect(mockExecutor.exec).toHaveBeenNthCalledWith(
      1,
      "terraform",
      ["init", "-input=false"],
      expect.objectContaining({ ignoreReturnCode: true }),
    );
    // providers lock
    expect(mockExecutor.exec).toHaveBeenNthCalledWith(
      2,
      "terraform",
      expect.arrayContaining(["providers", "lock"]),
      expect.objectContaining({
        comment: { token: "test-token" },
      }),
    );
    // providers
    expect(mockExecutor.exec).toHaveBeenNthCalledWith(
      3,
      "terraform",
      ["providers"],
      expect.any(Object),
    );
    expect(commitMod.create).not.toHaveBeenCalled();
  });

  it("PR, init fails: retries with -upgrade", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const gitMod = await import("../../lib/git");
    vi.mocked(gitMod.hasFileChanged).mockResolvedValue(false);

    // First init returns non-zero
    mockExecutor.exec
      .mockResolvedValueOnce(1) // init fails
      .mockResolvedValueOnce(0) // init -upgrade succeeds
      .mockResolvedValueOnce(0) // providers lock
      .mockResolvedValueOnce(0); // providers

    const input = {
      ...createBaseInput(mockExecutor),
      isPullRequest: true,
    };

    await run(input);

    // init + init -upgrade + providers lock + providers = 4 exec calls
    expect(mockExecutor.exec).toHaveBeenCalledTimes(4);
    expect(mockExecutor.exec).toHaveBeenNthCalledWith(
      2,
      "terraform",
      ["init", "-input=false", "-upgrade"],
      expect.objectContaining({
        comment: { token: "test-token" },
      }),
    );
  });

  it("PR, lock file changed: calls commit.create", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const gitMod = await import("../../lib/git");
    vi.mocked(gitMod.hasFileChanged).mockResolvedValue(true);
    const commitMod = await import("../../commit");

    const input = {
      ...createBaseInput(mockExecutor),
      isPullRequest: true,
    };

    await run(input);

    expect(commitMod.create).toHaveBeenCalledWith(
      expect.objectContaining({
        commitMessage: "chore: update .terraform.lock.hcl",
        githubToken: "test-token",
      }),
    );
  });

  it("PR, lock file new (did not exist before): calls commit.create without hasFileChanged", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const gitMod = await import("../../lib/git");
    const commitMod = await import("../../commit");

    const input = {
      ...createBaseInput(mockExecutor),
      isPullRequest: true,
    };

    await run(input);

    expect(gitMod.hasFileChanged).not.toHaveBeenCalled();
    expect(commitMod.create).toHaveBeenCalledWith(
      expect.objectContaining({
        commitMessage: "chore: update .terraform.lock.hcl",
      }),
    );
  });

  it("PR, lock file not changed: does not call commit.create", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const gitMod = await import("../../lib/git");
    vi.mocked(gitMod.hasFileChanged).mockResolvedValue(false);
    const commitMod = await import("../../commit");

    const input = {
      ...createBaseInput(mockExecutor),
      isPullRequest: true,
    };

    await run(input);

    expect(commitMod.create).not.toHaveBeenCalled();
  });

  it("terragrunt run available: uses run -- prefix on providers lock and providers", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const gitMod = await import("../../lib/git");
    vi.mocked(gitMod.hasFileChanged).mockResolvedValue(false);

    const input = {
      ...createBaseInput(mockExecutor),
      isPullRequest: true,
      tfCommand: "terragrunt",
      terragruntRunAvailable: true,
    };

    await run(input);

    // providers lock with run -- prefix
    expect(mockExecutor.exec).toHaveBeenNthCalledWith(
      2,
      "terragrunt",
      expect.arrayContaining(["run", "--", "providers", "lock"]),
      expect.objectContaining({
        group: "terragrunt run -- providers lock",
      }),
    );
    // providers with run -- prefix
    expect(mockExecutor.exec).toHaveBeenNthCalledWith(
      3,
      "terragrunt",
      ["run", "--", "providers"],
      expect.objectContaining({
        group: "terragrunt run -- providers",
      }),
    );
  });

  it("terragrunt run not available: no run -- prefix", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const gitMod = await import("../../lib/git");
    vi.mocked(gitMod.hasFileChanged).mockResolvedValue(false);

    const input = {
      ...createBaseInput(mockExecutor),
      isPullRequest: true,
      tfCommand: "terragrunt",
      terragruntRunAvailable: false,
    };

    await run(input);

    // providers lock without run -- prefix
    expect(mockExecutor.exec).toHaveBeenNthCalledWith(
      2,
      "terragrunt",
      expect.arrayContaining(["providers", "lock"]),
      expect.objectContaining({
        group: "terragrunt providers lock",
      }),
    );
    // Ensure "run" is not in the args
    const lockCallArgs = mockExecutor.exec.mock.calls[1][1] as string[];
    expect(lockCallArgs).not.toContain("run");

    // providers without run -- prefix
    expect(mockExecutor.exec).toHaveBeenNthCalledWith(
      3,
      "terragrunt",
      ["providers"],
      expect.objectContaining({
        group: "terragrunt providers",
      }),
    );
  });

  it("splits providersLockOpts by whitespace correctly", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const gitMod = await import("../../lib/git");
    vi.mocked(gitMod.hasFileChanged).mockResolvedValue(false);

    const input = {
      ...createBaseInput(mockExecutor),
      isPullRequest: true,
      providersLockOpts: "-platform=linux_amd64  -platform=darwin_arm64",
    };

    await run(input);

    expect(mockExecutor.exec).toHaveBeenNthCalledWith(
      2,
      "terraform",
      ["providers", "lock", "-platform=linux_amd64", "-platform=darwin_arm64"],
      expect.any(Object),
    );
  });

  it("empty providersLockOpts: produces providers lock with no extra args", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const gitMod = await import("../../lib/git");
    vi.mocked(gitMod.hasFileChanged).mockResolvedValue(false);

    const input = {
      ...createBaseInput(mockExecutor),
      isPullRequest: true,
      providersLockOpts: "",
    };

    await run(input);

    expect(mockExecutor.exec).toHaveBeenNthCalledWith(
      2,
      "terraform",
      ["providers", "lock"],
      expect.any(Object),
    );
  });

  it("non-PR + terragrunt: no run -- for init, uses run -- for providers", async () => {
    const input = {
      ...createBaseInput(mockExecutor),
      isPullRequest: false,
      tfCommand: "terragrunt",
      terragruntRunAvailable: true,
    };

    await run(input);

    expect(mockExecutor.exec).toHaveBeenCalledTimes(2);
    // init (no run -- prefix)
    expect(mockExecutor.exec).toHaveBeenNthCalledWith(
      1,
      "terragrunt",
      ["init", "-input=false"],
      expect.any(Object),
    );
    // providers with run -- prefix
    expect(mockExecutor.exec).toHaveBeenNthCalledWith(
      2,
      "terragrunt",
      ["run", "--", "providers"],
      expect.objectContaining({
        group: "terragrunt run -- providers",
      }),
    );
  });
});
