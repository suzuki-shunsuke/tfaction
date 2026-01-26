import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import {
  getPRNumberFromMergeGroup,
  writeOutputFiles,
  run,
  type PRFile,
  type PRData,
  type Logger,
  type RunInput,
} from "./index";

const createMockLogger = (): Logger => ({
  info: vi.fn(),
  warning: vi.fn(),
});

describe("getPRNumberFromMergeGroup", () => {
  it("returns PR number for valid merge_group format pr-123-abc", () => {
    expect(getPRNumberFromMergeGroup("pr-123-abc")).toBe(123);
  });

  it("returns PR number for pr-1-x", () => {
    expect(getPRNumberFromMergeGroup("pr-1-x")).toBe(1);
  });

  it("returns PR number with multiple dashes in suffix", () => {
    expect(getPRNumberFromMergeGroup("pr-456-abc-def-123")).toBe(456);
  });

  it("returns undefined for undefined refName", () => {
    expect(getPRNumberFromMergeGroup(undefined)).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(getPRNumberFromMergeGroup("")).toBeUndefined();
  });

  it("returns undefined and logs warning when no dash after number", () => {
    const logger = createMockLogger();
    expect(getPRNumberFromMergeGroup("pr-123", logger)).toBeUndefined();
    expect(logger.warning).toHaveBeenCalledWith(
      "GITHUB_REF_NAME is not a valid merge_group format: pr-123",
    );
  });

  it("returns undefined and logs warning for non-numeric PR number", () => {
    const logger = createMockLogger();
    expect(getPRNumberFromMergeGroup("pr-abc-def", logger)).toBeUndefined();
    expect(logger.warning).toHaveBeenCalledWith(
      "Failed to parse PR number from GITHUB_REF_NAME: pr-abc-def",
    );
  });

  it("returns undefined for format without pr- prefix", () => {
    const logger = createMockLogger();
    // Without pr- prefix, it becomes "main" after replace, no dash found
    expect(getPRNumberFromMergeGroup("main", logger)).toBeUndefined();
    expect(logger.warning).toHaveBeenCalled();
  });

  it("handles large PR numbers", () => {
    expect(getPRNumberFromMergeGroup("pr-99999-sha")).toBe(99999);
  });
});

describe("writeOutputFiles", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ci-info-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const createPRData = (overrides?: Partial<PRData>): PRData => ({
    body: "PR description",
    base: { ref: "main" },
    head: { ref: "feature-branch", sha: "abc123" },
    user: { login: "testuser" },
    merged: false,
    labels: [{ name: "bug" }, { name: "enhancement" }],
    ...overrides,
  });

  it("creates all expected files", async () => {
    const prData = createPRData();
    const files: PRFile[] = [{ filename: "src/index.ts" }];

    await writeOutputFiles(tempDir, prData, files);

    const dirContents = await fs.readdir(tempDir);
    expect(dirContents).toContain("pr.json");
    expect(dirContents).toContain("pr_files.json");
    expect(dirContents).toContain("pr_files.txt");
    expect(dirContents).toContain("pr_all_filenames.txt");
    expect(dirContents).toContain("labels.txt");
  });

  it("writes pr.json with correct content", async () => {
    const prData = createPRData();
    const files: PRFile[] = [];

    await writeOutputFiles(tempDir, prData, files);

    const content = await fs.readFile(path.join(tempDir, "pr.json"), "utf-8");
    const parsed = JSON.parse(content);
    expect(parsed.body).toBe("PR description");
    expect(parsed.base.ref).toBe("main");
    expect(parsed.head.ref).toBe("feature-branch");
    expect(parsed.user.login).toBe("testuser");
  });

  it("writes pr_files.json with file list", async () => {
    const prData = createPRData();
    const files: PRFile[] = [
      { filename: "src/index.ts" },
      { filename: "README.md" },
    ];

    await writeOutputFiles(tempDir, prData, files);

    const content = await fs.readFile(
      path.join(tempDir, "pr_files.json"),
      "utf-8",
    );
    const parsed = JSON.parse(content);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].filename).toBe("src/index.ts");
    expect(parsed[1].filename).toBe("README.md");
  });

  it("writes pr_files.txt with filenames only", async () => {
    const prData = createPRData();
    const files: PRFile[] = [
      { filename: "src/index.ts" },
      { filename: "README.md" },
    ];

    await writeOutputFiles(tempDir, prData, files);

    const content = await fs.readFile(
      path.join(tempDir, "pr_files.txt"),
      "utf-8",
    );
    expect(content).toBe("src/index.ts\nREADME.md");
  });

  it("writes pr_all_filenames.txt including previous_filename for renames", async () => {
    const prData = createPRData();
    const files: PRFile[] = [
      { filename: "src/new-name.ts", previous_filename: "src/old-name.ts" },
      { filename: "README.md" },
    ];

    await writeOutputFiles(tempDir, prData, files);

    const content = await fs.readFile(
      path.join(tempDir, "pr_all_filenames.txt"),
      "utf-8",
    );
    const filenames = content.split("\n");
    expect(filenames).toContain("src/new-name.ts");
    expect(filenames).toContain("src/old-name.ts");
    expect(filenames).toContain("README.md");
  });

  it("writes labels.txt with label names", async () => {
    const prData = createPRData({
      labels: [{ name: "bug" }, { name: "enhancement" }, { name: "urgent" }],
    });
    const files: PRFile[] = [];

    await writeOutputFiles(tempDir, prData, files);

    const content = await fs.readFile(path.join(tempDir, "labels.txt"), "utf-8");
    expect(content).toBe("bug\nenhancement\nurgent");
  });

  it("handles empty labels array", async () => {
    const prData = createPRData({ labels: [] });
    const files: PRFile[] = [];

    await writeOutputFiles(tempDir, prData, files);

    const content = await fs.readFile(path.join(tempDir, "labels.txt"), "utf-8");
    expect(content).toBe("");
  });

  it("handles undefined labels", async () => {
    const prData = createPRData({ labels: undefined });
    const files: PRFile[] = [];

    await writeOutputFiles(tempDir, prData, files);

    const content = await fs.readFile(path.join(tempDir, "labels.txt"), "utf-8");
    expect(content).toBe("");
  });

  it("handles empty files array", async () => {
    const prData = createPRData();
    const files: PRFile[] = [];

    await writeOutputFiles(tempDir, prData, files);

    const prFilesContent = await fs.readFile(
      path.join(tempDir, "pr_files.txt"),
      "utf-8",
    );
    expect(prFilesContent).toBe("");

    const allFilesContent = await fs.readFile(
      path.join(tempDir, "pr_all_filenames.txt"),
      "utf-8",
    );
    expect(allFilesContent).toBe("");
  });

  it("creates directory if it does not exist", async () => {
    const nestedDir = path.join(tempDir, "nested", "dir");
    const prData = createPRData();
    const files: PRFile[] = [];

    await writeOutputFiles(nestedDir, prData, files);

    const exists = await fs
      .access(nestedDir)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });
});

describe("run", () => {
  let tempDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ci-info-run-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const createMockOctokit = () => ({
    rest: {
      repos: {
        listPullRequestsAssociatedWithCommit: vi.fn(),
      },
      pulls: {
        get: vi.fn(),
        listFiles: vi.fn(),
      },
    },
  });

  it("returns empty result when no PR number found", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();

    octokit.rest.repos.listPullRequestsAssociatedWithCommit.mockResolvedValue({
      data: [],
    });

    const input: RunInput = {
      repoOwner: "owner",
      repoName: "repo",
      eventName: "push",
      sha: "abc123",
      octokit: octokit as unknown as RunInput["octokit"],
      tempDir,
      logger,
    };

    const result = await run(input);

    expect(result).toEqual({});
    expect(logger.info).toHaveBeenCalledWith(
      "No PR number found - running in non-PR environment",
    );
  });

  it("extracts PR number from merge_group event ref name", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();

    const prData = {
      body: "Test PR",
      base: { ref: "main" },
      head: { ref: "feature", sha: "def456" },
      user: { login: "testuser" },
      merged: false,
      labels: [],
    };

    octokit.rest.pulls.get.mockResolvedValue({ data: prData });
    octokit.rest.pulls.listFiles.mockResolvedValue({ data: [] });

    const input: RunInput = {
      repoOwner: "owner",
      repoName: "repo",
      eventName: "merge_group",
      refName: "pr-42-sha123",
      sha: "abc123",
      octokit: octokit as unknown as RunInput["octokit"],
      tempDir,
      logger,
    };

    const result = await run(input);

    expect(result.pr).toBeDefined();
    expect(octokit.rest.pulls.get).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      pull_number: 42,
    });
  });

  it("fetches PR number from SHA when not provided and not merge_group", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();

    const prData = {
      body: "Test PR",
      base: { ref: "main" },
      head: { ref: "feature", sha: "def456" },
      user: { login: "testuser" },
      merged: false,
      labels: [],
    };

    octokit.rest.repos.listPullRequestsAssociatedWithCommit.mockResolvedValue({
      data: [{ number: 99 }],
    });
    octokit.rest.pulls.get.mockResolvedValue({ data: prData });
    octokit.rest.pulls.listFiles.mockResolvedValue({ data: [] });

    const input: RunInput = {
      repoOwner: "owner",
      repoName: "repo",
      eventName: "push",
      sha: "abc123",
      octokit: octokit as unknown as RunInput["octokit"],
      tempDir,
      logger,
    };

    const result = await run(input);

    expect(result.pr).toBeDefined();
    expect(
      octokit.rest.repos.listPullRequestsAssociatedWithCommit,
    ).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      commit_sha: "abc123",
    });
    expect(octokit.rest.pulls.get).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      pull_number: 99,
    });
  });

  it("uses provided prNumber directly for pull_request event", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();

    const prData = {
      body: "Test PR",
      base: { ref: "main" },
      head: { ref: "feature", sha: "def456" },
      user: { login: "testuser" },
      merged: false,
      labels: [{ name: "test-label" }],
    };

    octokit.rest.pulls.get.mockResolvedValue({ data: prData });
    octokit.rest.pulls.listFiles.mockResolvedValue({
      data: [{ filename: "src/index.ts" }],
    });

    const input: RunInput = {
      repoOwner: "owner",
      repoName: "repo",
      prNumber: 123,
      eventName: "pull_request",
      sha: "abc123",
      octokit: octokit as unknown as RunInput["octokit"],
      tempDir,
      logger,
    };

    const result = await run(input);

    expect(result.pr).toBeDefined();
    expect(result.pr?.data.base.ref).toBe("main");
    expect(result.pr?.files).toEqual(["src/index.ts"]);
    expect(result.tempDir).toBe(tempDir);

    // Should not try to get PR from SHA since prNumber was provided
    expect(
      octokit.rest.repos.listPullRequestsAssociatedWithCommit,
    ).not.toHaveBeenCalled();
  });

  it("writes output files to tempDir", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();

    const prData = {
      body: "Test PR",
      base: { ref: "main" },
      head: { ref: "feature", sha: "def456" },
      user: { login: "testuser" },
      merged: true,
      labels: [{ name: "deployed" }],
    };

    octokit.rest.pulls.get.mockResolvedValue({ data: prData });
    octokit.rest.pulls.listFiles.mockResolvedValue({
      data: [{ filename: "file1.ts" }, { filename: "file2.ts" }],
    });

    const input: RunInput = {
      repoOwner: "owner",
      repoName: "repo",
      prNumber: 1,
      eventName: "pull_request",
      sha: "abc123",
      octokit: octokit as unknown as RunInput["octokit"],
      tempDir,
      logger,
    };

    await run(input);

    // Verify files were created
    const prJsonContent = await fs.readFile(
      path.join(tempDir, "pr.json"),
      "utf-8",
    );
    const prJson = JSON.parse(prJsonContent);
    expect(prJson.merged).toBe(true);

    const labelsContent = await fs.readFile(
      path.join(tempDir, "labels.txt"),
      "utf-8",
    );
    expect(labelsContent).toBe("deployed");

    const filesContent = await fs.readFile(
      path.join(tempDir, "pr_files.txt"),
      "utf-8",
    );
    expect(filesContent).toBe("file1.ts\nfile2.ts");
  });

  it("logs info messages during execution", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();

    const prData = {
      body: "Test PR",
      base: { ref: "main" },
      head: { ref: "feature", sha: "def456" },
      user: { login: "testuser" },
      merged: false,
      labels: [],
    };

    octokit.rest.pulls.get.mockResolvedValue({ data: prData });
    octokit.rest.pulls.listFiles.mockResolvedValue({
      data: [{ filename: "a.ts" }, { filename: "b.ts" }],
    });

    const input: RunInput = {
      repoOwner: "owner",
      repoName: "repo",
      prNumber: 10,
      eventName: "pull_request",
      sha: "abc123",
      octokit: octokit as unknown as RunInput["octokit"],
      tempDir,
      logger,
    };

    await run(input);

    expect(logger.info).toHaveBeenCalledWith("Fetching PR #10");
    expect(logger.info).toHaveBeenCalledWith("Fetching PR files");
    expect(logger.info).toHaveBeenCalledWith("Found 2 files");
  });
});
