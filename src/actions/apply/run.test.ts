import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildSearchQuery,
  parseGraphQLResult,
  listRelatedPullRequests,
  updateBranchByCommit,
  updateBranchBySecurefix,
  type Logger,
  type ListRelatedPullRequestsInput,
  type UpdateBranchByCommitInput,
  type UpdateBranchBySecurefixInput,
} from "./run";

describe("buildSearchQuery", () => {
  it("builds correct search query with owner, repo and target", () => {
    const query = buildSearchQuery("my-org", "my-repo", "aws/dev/vpc");
    expect(query).toBe(
      'repo:my-org/my-repo is:pr is:open label:"aws/dev/vpc" -label:tfaction:disable-auto-update',
    );
  });

  it("handles targets with special characters", () => {
    const query = buildSearchQuery(
      "owner",
      "repo",
      "gcp-prod/foo_bar/service-123",
    );
    expect(query).toBe(
      'repo:owner/repo is:pr is:open label:"gcp-prod/foo_bar/service-123" -label:tfaction:disable-auto-update',
    );
  });

  it("excludes PRs with disable-auto-update label", () => {
    const query = buildSearchQuery("owner", "repo", "target");
    expect(query).toContain("-label:tfaction:disable-auto-update");
  });
});

describe("parseGraphQLResult", () => {
  it("extracts PR numbers from GraphQL result", () => {
    const result = {
      search: {
        nodes: [{ number: 1 }, { number: 2 }, { number: 3 }],
      },
    };
    expect(parseGraphQLResult(result)).toEqual([1, 2, 3]);
  });

  it("returns empty array when no nodes", () => {
    const result = {
      search: {
        nodes: [],
      },
    };
    expect(parseGraphQLResult(result)).toEqual([]);
  });

  it("handles single PR", () => {
    const result = {
      search: {
        nodes: [{ number: 42 }],
      },
    };
    expect(parseGraphQLResult(result)).toEqual([42]);
  });
});

describe("listRelatedPullRequests", () => {
  const createMockOctokit = () => ({
    graphql: vi.fn(),
    rest: {
      pulls: {
        updateBranch: vi.fn(),
      },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns PR numbers from GraphQL query", async () => {
    const octokit = createMockOctokit();
    octokit.graphql.mockResolvedValue({
      search: {
        nodes: [{ number: 10 }, { number: 20 }, { number: 30 }],
      },
    });

    const input: ListRelatedPullRequestsInput = {
      octokit: octokit as unknown as ListRelatedPullRequestsInput["octokit"],
      owner: "my-org",
      repo: "my-repo",
      target: "aws/dev/vpc",
    };

    const result = await listRelatedPullRequests(input);

    expect(result).toEqual([10, 20, 30]);
    expect(octokit.graphql).toHaveBeenCalledWith(expect.any(String), {
      q: 'repo:my-org/my-repo is:pr is:open label:"aws/dev/vpc" -label:tfaction:disable-auto-update',
    });
  });

  it("returns empty array when no PRs found", async () => {
    const octokit = createMockOctokit();
    octokit.graphql.mockResolvedValue({
      search: {
        nodes: [],
      },
    });

    const input: ListRelatedPullRequestsInput = {
      octokit: octokit as unknown as ListRelatedPullRequestsInput["octokit"],
      owner: "owner",
      repo: "repo",
      target: "target",
    };

    const result = await listRelatedPullRequests(input);

    expect(result).toEqual([]);
  });

  it("uses correct GraphQL query structure", async () => {
    const octokit = createMockOctokit();
    octokit.graphql.mockResolvedValue({
      search: {
        nodes: [],
      },
    });

    const input: ListRelatedPullRequestsInput = {
      octokit: octokit as unknown as ListRelatedPullRequestsInput["octokit"],
      owner: "owner",
      repo: "repo",
      target: "target",
    };

    await listRelatedPullRequests(input);

    // Check that the GraphQL query contains required elements
    const call = octokit.graphql.mock.calls[0];
    const query = call[0] as string;
    expect(query).toContain("query($q: String!)");
    expect(query).toContain("search(query: $q, type: ISSUE, first: 100)");
    expect(query).toContain("... on PullRequest");
    expect(query).toContain("number");
  });
});

describe("updateBranchByCommit", () => {
  const createMockOctokit = () => ({
    rest: {
      pulls: {
        updateBranch: vi.fn(),
      },
    },
  });

  const createMockLogger = (): Logger => ({
    info: vi.fn(),
    notice: vi.fn(),
    warning: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates branches for all PR numbers", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.rest.pulls.updateBranch.mockResolvedValue({
      data: { url: "https://github.com/owner/repo/pull/1" },
    });

    const input: UpdateBranchByCommitInput = {
      octokit: octokit as unknown as UpdateBranchByCommitInput["octokit"],
      owner: "owner",
      repo: "repo",
      prNumbers: [1, 2, 3],
      logger,
    };

    await updateBranchByCommit(input);

    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledTimes(3);
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      pull_number: 1,
    });
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      pull_number: 2,
    });
    expect(octokit.rest.pulls.updateBranch).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      pull_number: 3,
    });
  });

  it("logs notice on successful update", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.rest.pulls.updateBranch.mockResolvedValue({
      data: { url: "https://github.com/owner/repo/pull/1" },
    });

    const input: UpdateBranchByCommitInput = {
      octokit: octokit as unknown as UpdateBranchByCommitInput["octokit"],
      owner: "owner",
      repo: "repo",
      prNumbers: [1],
      logger,
    };

    await updateBranchByCommit(input);

    expect(logger.notice).toHaveBeenCalledWith(
      "Updated a branch https://github.com/owner/repo/pull/1",
    );
  });

  it("logs warning on failure and continues", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.rest.pulls.updateBranch
      .mockRejectedValueOnce(new Error("API error"))
      .mockResolvedValueOnce({
        data: { url: "https://github.com/owner/repo/pull/2" },
      });

    const input: UpdateBranchByCommitInput = {
      octokit: octokit as unknown as UpdateBranchByCommitInput["octokit"],
      owner: "owner",
      repo: "repo",
      prNumbers: [1, 2],
      logger,
    };

    await updateBranchByCommit(input);

    expect(logger.warning).toHaveBeenCalledWith(
      expect.stringContaining("Failed to update branch for PR #1"),
    );
    expect(logger.notice).toHaveBeenCalledWith(
      "Updated a branch https://github.com/owner/repo/pull/2",
    );
  });

  it("handles empty PR numbers array", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();

    const input: UpdateBranchByCommitInput = {
      octokit: octokit as unknown as UpdateBranchByCommitInput["octokit"],
      owner: "owner",
      repo: "repo",
      prNumbers: [],
      logger,
    };

    await updateBranchByCommit(input);

    expect(octokit.rest.pulls.updateBranch).not.toHaveBeenCalled();
  });
});

describe("updateBranchBySecurefix", () => {
  const createMockOctokit = () => ({});

  const createMockLogger = (): Logger => ({
    info: vi.fn(),
    notice: vi.fn(),
    warning: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls updateBranchFn for each PR number", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    const updateBranchFn = vi.fn().mockResolvedValue(undefined);

    const input: UpdateBranchBySecurefixInput = {
      octokit: octokit as unknown as UpdateBranchBySecurefixInput["octokit"],
      serverRepoOwner: "server-owner",
      serverRepoName: "server-repo",
      owner: "owner",
      repo: "repo",
      serverUrl: "https://github.com",
      prNumbers: [1, 2],
      updateBranchFn,
      logger,
    };

    await updateBranchBySecurefix(input);

    expect(updateBranchFn).toHaveBeenCalledTimes(2);
    expect(updateBranchFn).toHaveBeenCalledWith({
      octokit,
      owner: "owner",
      repo: "repo",
      pullRequestNumber: 1,
      serverRepositoryOwner: "server-owner",
      serverRepositoryName: "server-repo",
    });
    expect(updateBranchFn).toHaveBeenCalledWith({
      octokit,
      owner: "owner",
      repo: "repo",
      pullRequestNumber: 2,
      serverRepositoryOwner: "server-owner",
      serverRepositoryName: "server-repo",
    });
  });

  it("logs info message for each PR", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    const updateBranchFn = vi.fn().mockResolvedValue(undefined);

    const input: UpdateBranchBySecurefixInput = {
      octokit: octokit as unknown as UpdateBranchBySecurefixInput["octokit"],
      serverRepoOwner: "server-owner",
      serverRepoName: "server-repo",
      owner: "owner",
      repo: "repo",
      serverUrl: "https://github.com",
      prNumbers: [42],
      updateBranchFn,
      logger,
    };

    await updateBranchBySecurefix(input);

    expect(logger.info).toHaveBeenCalledWith(
      "Updating a branch https://github.com/owner/repo/pull/42",
    );
  });

  it("logs warning on failure and continues", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    const updateBranchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Securefix error"))
      .mockResolvedValueOnce(undefined);

    const input: UpdateBranchBySecurefixInput = {
      octokit: octokit as unknown as UpdateBranchBySecurefixInput["octokit"],
      serverRepoOwner: "server-owner",
      serverRepoName: "server-repo",
      owner: "owner",
      repo: "repo",
      serverUrl: "https://github.com",
      prNumbers: [1, 2],
      updateBranchFn,
      logger,
    };

    await updateBranchBySecurefix(input);

    expect(logger.warning).toHaveBeenCalledWith(
      expect.stringContaining("Failed to update branch for PR #1"),
    );
    expect(logger.info).toHaveBeenCalledWith(
      "Updating a branch https://github.com/owner/repo/pull/2",
    );
  });

  it("handles empty PR numbers array", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    const updateBranchFn = vi.fn();

    const input: UpdateBranchBySecurefixInput = {
      octokit: octokit as unknown as UpdateBranchBySecurefixInput["octokit"],
      serverRepoOwner: "server-owner",
      serverRepoName: "server-repo",
      owner: "owner",
      repo: "repo",
      serverUrl: "https://github.com",
      prNumbers: [],
      updateBranchFn,
      logger,
    };

    await updateBranchBySecurefix(input);

    expect(updateBranchFn).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });

  it("uses provided serverUrl for log messages", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    const updateBranchFn = vi.fn().mockResolvedValue(undefined);

    const input: UpdateBranchBySecurefixInput = {
      octokit: octokit as unknown as UpdateBranchBySecurefixInput["octokit"],
      serverRepoOwner: "server-owner",
      serverRepoName: "server-repo",
      owner: "my-org",
      repo: "my-repo",
      serverUrl: "https://github.example.com",
      prNumbers: [99],
      updateBranchFn,
      logger,
    };

    await updateBranchBySecurefix(input);

    expect(logger.info).toHaveBeenCalledWith(
      "Updating a branch https://github.example.com/my-org/my-repo/pull/99",
    );
  });
});
