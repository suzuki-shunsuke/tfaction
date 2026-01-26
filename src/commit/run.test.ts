import { describe, it, expect, vi, beforeEach } from "vitest";
import { run, type RunInput, type Logger } from "./run";

describe("run", () => {
  const createMockOctokit = () => ({
    rest: {
      repos: {
        get: vi.fn(),
      },
      pulls: {
        create: vi.fn(),
      },
      issues: {
        createComment: vi.fn(),
        addLabels: vi.fn(),
        addAssignees: vi.fn(),
      },
    },
  });

  const createMockLogger = (): Logger => ({
    info: vi.fn(),
    notice: vi.fn(),
  });

  // Mock commit.createCommit
  vi.mock("@suzuki-shunsuke/commit-ts", () => ({
    createCommit: vi.fn().mockResolvedValue(undefined),
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates commit only when pr is not specified", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    const input: RunInput = {
      commitMessage: "test commit",
      files: new Set(["file1.txt", "file2.txt"]),
      branch: "feature-branch",
      repoOwner: "owner",
      repoName: "repo",
      octokit: octokit as unknown as RunInput["octokit"],
      logger,
    };

    const result = await run(input);

    expect(result).toBe("");
    expect(octokit.rest.repos.get).not.toHaveBeenCalled();
    expect(octokit.rest.pulls.create).not.toHaveBeenCalled();
  });

  it("creates PR and returns html_url when pr is specified", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.rest.repos.get.mockResolvedValue({
      data: { default_branch: "main" },
    });
    octokit.rest.pulls.create.mockResolvedValue({
      data: {
        number: 123,
        html_url: "https://github.com/owner/repo/pull/123",
      },
    });

    const input: RunInput = {
      commitMessage: "test commit",
      files: new Set(["file1.txt"]),
      branch: "feature-branch",
      repoOwner: "owner",
      repoName: "repo",
      octokit: octokit as unknown as RunInput["octokit"],
      logger,
      pr: {
        title: "Test PR",
        body: "PR description",
      },
    };

    const result = await run(input);

    expect(result).toBe("https://github.com/owner/repo/pull/123");
    expect(octokit.rest.repos.get).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
    });
    expect(octokit.rest.pulls.create).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      head: "feature-branch",
      base: "main",
      title: "Test PR",
      body: "PR description",
      draft: undefined,
    });
    expect(logger.notice).toHaveBeenCalledWith(
      "Created PR: https://github.com/owner/repo/pull/123",
    );
  });

  it("adds comment when pr.comment is specified", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.rest.repos.get.mockResolvedValue({
      data: { default_branch: "main" },
    });
    octokit.rest.pulls.create.mockResolvedValue({
      data: {
        number: 456,
        html_url: "https://github.com/owner/repo/pull/456",
      },
    });

    const input: RunInput = {
      commitMessage: "test commit",
      files: new Set(["file1.txt"]),
      branch: "feature-branch",
      repoOwner: "owner",
      repoName: "repo",
      octokit: octokit as unknown as RunInput["octokit"],
      logger,
      pr: {
        title: "Test PR",
        comment: "This is a comment",
      },
    };

    await run(input);

    expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 456,
      body: "This is a comment",
    });
  });

  it("does not add comment when pr.comment is not specified", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.rest.repos.get.mockResolvedValue({
      data: { default_branch: "main" },
    });
    octokit.rest.pulls.create.mockResolvedValue({
      data: {
        number: 123,
        html_url: "https://github.com/owner/repo/pull/123",
      },
    });

    const input: RunInput = {
      commitMessage: "test commit",
      files: new Set(["file1.txt"]),
      branch: "feature-branch",
      repoOwner: "owner",
      repoName: "repo",
      octokit: octokit as unknown as RunInput["octokit"],
      logger,
      pr: {
        title: "Test PR",
      },
    };

    await run(input);

    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it("adds labels when pr.labels is specified", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.rest.repos.get.mockResolvedValue({
      data: { default_branch: "main" },
    });
    octokit.rest.pulls.create.mockResolvedValue({
      data: {
        number: 789,
        html_url: "https://github.com/owner/repo/pull/789",
      },
    });

    const input: RunInput = {
      commitMessage: "test commit",
      files: new Set(["file1.txt"]),
      branch: "feature-branch",
      repoOwner: "owner",
      repoName: "repo",
      octokit: octokit as unknown as RunInput["octokit"],
      logger,
      pr: {
        title: "Test PR",
        labels: ["bug", "enhancement"],
      },
    };

    await run(input);

    expect(octokit.rest.issues.addLabels).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 789,
      labels: ["bug", "enhancement"],
    });
  });

  it("does not add labels when pr.labels is empty", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.rest.repos.get.mockResolvedValue({
      data: { default_branch: "main" },
    });
    octokit.rest.pulls.create.mockResolvedValue({
      data: {
        number: 123,
        html_url: "https://github.com/owner/repo/pull/123",
      },
    });

    const input: RunInput = {
      commitMessage: "test commit",
      files: new Set(["file1.txt"]),
      branch: "feature-branch",
      repoOwner: "owner",
      repoName: "repo",
      octokit: octokit as unknown as RunInput["octokit"],
      logger,
      pr: {
        title: "Test PR",
        labels: [],
      },
    };

    await run(input);

    expect(octokit.rest.issues.addLabels).not.toHaveBeenCalled();
  });

  it("adds assignees when pr.assignees is specified", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.rest.repos.get.mockResolvedValue({
      data: { default_branch: "main" },
    });
    octokit.rest.pulls.create.mockResolvedValue({
      data: {
        number: 101,
        html_url: "https://github.com/owner/repo/pull/101",
      },
    });

    const input: RunInput = {
      commitMessage: "test commit",
      files: new Set(["file1.txt"]),
      branch: "feature-branch",
      repoOwner: "owner",
      repoName: "repo",
      octokit: octokit as unknown as RunInput["octokit"],
      logger,
      pr: {
        title: "Test PR",
        assignees: ["user1", "user2"],
      },
    };

    await run(input);

    expect(octokit.rest.issues.addAssignees).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 101,
      assignees: ["user1", "user2"],
    });
  });

  it("does not add assignees when pr.assignees is empty", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.rest.repos.get.mockResolvedValue({
      data: { default_branch: "main" },
    });
    octokit.rest.pulls.create.mockResolvedValue({
      data: {
        number: 123,
        html_url: "https://github.com/owner/repo/pull/123",
      },
    });

    const input: RunInput = {
      commitMessage: "test commit",
      files: new Set(["file1.txt"]),
      branch: "feature-branch",
      repoOwner: "owner",
      repoName: "repo",
      octokit: octokit as unknown as RunInput["octokit"],
      logger,
      pr: {
        title: "Test PR",
        assignees: [],
      },
    };

    await run(input);

    expect(octokit.rest.issues.addAssignees).not.toHaveBeenCalled();
  });

  it("creates PR with draft option", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.rest.repos.get.mockResolvedValue({
      data: { default_branch: "develop" },
    });
    octokit.rest.pulls.create.mockResolvedValue({
      data: {
        number: 200,
        html_url: "https://github.com/owner/repo/pull/200",
      },
    });

    const input: RunInput = {
      commitMessage: "test commit",
      files: new Set(["file1.txt"]),
      branch: "feature-branch",
      repoOwner: "owner",
      repoName: "repo",
      octokit: octokit as unknown as RunInput["octokit"],
      logger,
      pr: {
        title: "Draft PR",
        draft: true,
      },
    };

    await run(input);

    expect(octokit.rest.pulls.create).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      head: "feature-branch",
      base: "develop",
      title: "Draft PR",
      body: undefined,
      draft: true,
    });
  });

  it("handles all PR options together", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.rest.repos.get.mockResolvedValue({
      data: { default_branch: "main" },
    });
    octokit.rest.pulls.create.mockResolvedValue({
      data: {
        number: 999,
        html_url: "https://github.com/owner/repo/pull/999",
      },
    });

    const input: RunInput = {
      commitMessage: "test commit",
      files: new Set(["file1.txt", "file2.txt"]),
      branch: "feature-branch",
      repoOwner: "owner",
      repoName: "repo",
      octokit: octokit as unknown as RunInput["octokit"],
      logger,
      pr: {
        title: "Complete PR",
        body: "PR body",
        draft: false,
        comment: "Initial comment",
        labels: ["label1", "label2"],
        assignees: ["dev1", "dev2"],
      },
    };

    const result = await run(input);

    expect(result).toBe("https://github.com/owner/repo/pull/999");
    expect(octokit.rest.pulls.create).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      head: "feature-branch",
      base: "main",
      title: "Complete PR",
      body: "PR body",
      draft: false,
    });
    expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 999,
      body: "Initial comment",
    });
    expect(octokit.rest.issues.addLabels).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 999,
      labels: ["label1", "label2"],
    });
    expect(octokit.rest.issues.addAssignees).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 999,
      assignees: ["dev1", "dev2"],
    });
  });
});
