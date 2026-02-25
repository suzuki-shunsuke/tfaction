import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RunInput } from "./run";

vi.mock("@actions/github", () => ({
  getOctokit: vi.fn(),
}));

vi.mock("./update-branch", () => ({
  listRelatedPullRequests: vi.fn(),
  updateBranchByCommit: vi.fn(),
  updateBranchBySecurefix: vi.fn(),
}));

import * as github from "@actions/github";
import {
  listRelatedPullRequests,
  updateBranchByCommit,
  updateBranchBySecurefix,
} from "./update-branch";
import { run } from "./run";

const createMockLogger = () => ({
  info: vi.fn(),
  notice: vi.fn(),
  warning: vi.fn(),
});

const createBaseInput = (overrides: Partial<RunInput> = {}): RunInput => ({
  githubToken: "gh-token",
  target: "aws/dev/vpc",
  csmActionsServerRepository: "",
  csmAppId: "",
  csmAppPrivateKey: "",
  repoOwner: "owner",
  repoName: "repo",
  serverUrl: "https://github.com",
  updateBranchFn: vi.fn(),
  createGithubAppToken: vi.fn(),
  hasExpired: vi.fn(),
  revokeToken: vi.fn(),
  logger: createMockLogger(),
  ...overrides,
});

describe("run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls updateBranchByCommit when csmActionsServerRepository is empty", async () => {
    const mockOctokit = { graphql: vi.fn() };
    vi.mocked(github.getOctokit).mockReturnValue(
      mockOctokit as unknown as ReturnType<typeof github.getOctokit>,
    );
    vi.mocked(listRelatedPullRequests).mockResolvedValue([10, 20]);

    const input = createBaseInput({
      csmActionsServerRepository: "",
    });

    await run(input);

    expect(github.getOctokit).toHaveBeenCalledWith("gh-token");
    expect(listRelatedPullRequests).toHaveBeenCalledWith({
      octokit: mockOctokit,
      owner: "owner",
      repo: "repo",
      target: "aws/dev/vpc",
    });
    expect(updateBranchByCommit).toHaveBeenCalledWith({
      octokit: mockOctokit,
      owner: "owner",
      repo: "repo",
      prNumbers: [10, 20],
      logger: input.logger,
    });
    expect(updateBranchBySecurefix).not.toHaveBeenCalled();
  });

  it("calls updateBranchBySecurefix when csmActionsServerRepository is set", async () => {
    const mockOctokit = { graphql: vi.fn() };
    const mockCsmOctokit = { rest: {} };
    vi.mocked(github.getOctokit)
      .mockReturnValueOnce(
        mockOctokit as unknown as ReturnType<typeof github.getOctokit>,
      )
      .mockReturnValueOnce(
        mockCsmOctokit as unknown as ReturnType<typeof github.getOctokit>,
      );
    vi.mocked(listRelatedPullRequests).mockResolvedValue([5]);

    const createGithubAppToken = vi.fn().mockResolvedValue({
      token: "app-token",
      expiresAt: "2099-01-01T00:00:00Z",
    });
    const hasExpired = vi.fn().mockReturnValue(false);
    const revokeToken = vi.fn().mockResolvedValue(undefined);

    const input = createBaseInput({
      csmActionsServerRepository: "server-repo",
      csmAppId: "app-id",
      csmAppPrivateKey: "private-key",
      createGithubAppToken,
      hasExpired,
      revokeToken,
    });

    await run(input);

    expect(createGithubAppToken).toHaveBeenCalledWith({
      appId: "app-id",
      privateKey: "private-key",
      owner: "owner",
      repositories: ["server-repo"],
      permissions: { issues: "write" },
    });
    expect(updateBranchBySecurefix).toHaveBeenCalledWith({
      octokit: mockCsmOctokit,
      serverRepoOwner: "owner",
      serverRepoName: "server-repo",
      owner: "owner",
      repo: "repo",
      serverUrl: "https://github.com",
      prNumbers: [5],
      updateBranchFn: input.updateBranchFn,
      logger: input.logger,
    });
    expect(revokeToken).toHaveBeenCalledWith("app-token");
    expect(updateBranchByCommit).not.toHaveBeenCalled();
  });

  it("revokes token even when updateBranchBySecurefix throws", async () => {
    const mockOctokit = {};
    const mockCsmOctokit = {};
    vi.mocked(github.getOctokit)
      .mockReturnValueOnce(
        mockOctokit as unknown as ReturnType<typeof github.getOctokit>,
      )
      .mockReturnValueOnce(
        mockCsmOctokit as unknown as ReturnType<typeof github.getOctokit>,
      );
    vi.mocked(listRelatedPullRequests).mockResolvedValue([1]);
    vi.mocked(updateBranchBySecurefix).mockRejectedValue(
      new Error("update failed"),
    );

    const createGithubAppToken = vi.fn().mockResolvedValue({
      token: "app-token",
      expiresAt: "2099-01-01T00:00:00Z",
    });
    const hasExpired = vi.fn().mockReturnValue(false);
    const revokeToken = vi.fn().mockResolvedValue(undefined);

    const input = createBaseInput({
      csmActionsServerRepository: "server-repo",
      createGithubAppToken,
      hasExpired,
      revokeToken,
    });

    await expect(run(input)).rejects.toThrow("update failed");
    expect(revokeToken).toHaveBeenCalledWith("app-token");
  });

  it("does not revoke token when it has expired", async () => {
    const mockOctokit = {};
    const mockCsmOctokit = {};
    vi.mocked(github.getOctokit)
      .mockReturnValueOnce(
        mockOctokit as unknown as ReturnType<typeof github.getOctokit>,
      )
      .mockReturnValueOnce(
        mockCsmOctokit as unknown as ReturnType<typeof github.getOctokit>,
      );
    vi.mocked(listRelatedPullRequests).mockResolvedValue([1]);
    vi.mocked(updateBranchBySecurefix).mockResolvedValue(undefined);

    const createGithubAppToken = vi.fn().mockResolvedValue({
      token: "app-token",
      expiresAt: "2020-01-01T00:00:00Z",
    });
    const hasExpired = vi.fn().mockReturnValue(true);
    const revokeToken = vi.fn();

    const input = createBaseInput({
      csmActionsServerRepository: "server-repo",
      createGithubAppToken,
      hasExpired,
      revokeToken,
    });

    await run(input);

    expect(revokeToken).not.toHaveBeenCalled();
  });
});
