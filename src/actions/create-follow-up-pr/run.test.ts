import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@actions/core", () => ({
  info: vi.fn(),
}));

vi.mock("@actions/github", () => ({
  getOctokit: vi.fn(),
  context: {
    repo: {
      owner: "test-owner",
      repo: "test-repo",
    },
  },
}));

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    appendFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  };
});

vi.mock("../../lib", () => ({
  getConfig: vi.fn(),
  getJobType: vi.fn(),
  GitHubCommentConfig: "/mock/config/github-comment.yaml",
}));

vi.mock("../../aqua", () => ({
  NewExecutor: vi.fn(),
}));

vi.mock("../../commit", () => ({
  create: vi.fn(),
}));

vi.mock("../get-target-config", () => ({
  getTargetConfig: vi.fn(),
}));

import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";

import * as lib from "../../lib";
import * as aqua from "../../aqua";
import * as commit from "../../commit";
import { getTargetConfig } from "../get-target-config";

import {
  escapeRegExp,
  getOrCreateGroupLabel,
  generatePRParams,
  createFailedPrsFile,
  postSkipCreateComment,
  run,
  type GroupLabelParams,
  type GeneratePRParamsInput,
  type SkipCreateCommentParams,
  type RunInput,
} from "./run";

const createMockOctokit = () => ({
  rest: {
    issues: {
      createLabel: vi.fn(),
      addLabels: vi.fn(),
    },
  },
});

type MockOctokit = ReturnType<typeof createMockOctokit>;

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

describe("escapeRegExp", () => {
  it("escapes all special regex characters", () => {
    expect(escapeRegExp(".*+?^${}()|[]\\")).toBe(
      "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\",
    );
  });

  it("returns unchanged string with no special characters", () => {
    expect(escapeRegExp("hello world")).toBe("hello world");
  });
});

describe("getOrCreateGroupLabel", () => {
  let mockOctokit: MockOctokit;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOctokit = createMockOctokit();
  });

  it('returns "" when groupLabelEnabled is false', async () => {
    const result = await getOrCreateGroupLabel({
      octokit: mockOctokit as unknown as GroupLabelParams["octokit"],
      owner: "test-owner",
      repo: "test-repo",
      groupLabelEnabled: false,
      groupLabelPrefix: "tfaction:follow-up-pr-group/",
      prNumber: "123",
      tempDir: "/tmp/test",
    });
    expect(result).toBe("");
  });

  it('returns "" when tempDir is empty', async () => {
    const result = await getOrCreateGroupLabel({
      octokit: mockOctokit as unknown as GroupLabelParams["octokit"],
      owner: "test-owner",
      repo: "test-repo",
      groupLabelEnabled: true,
      groupLabelPrefix: "tfaction:follow-up-pr-group/",
      prNumber: "123",
      tempDir: "",
    });
    expect(result).toBe("");
  });

  it("returns existing group label found in labels.txt", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      "some-label\ntfaction:follow-up-pr-group/42\n",
    );

    const result = await getOrCreateGroupLabel({
      octokit: mockOctokit as unknown as GroupLabelParams["octokit"],
      owner: "test-owner",
      repo: "test-repo",
      groupLabelEnabled: true,
      groupLabelPrefix: "tfaction:follow-up-pr-group/",
      prNumber: "123",
      tempDir: "/tmp/test",
    });

    expect(result).toBe("tfaction:follow-up-pr-group/42");
    expect(mockOctokit.rest.issues.createLabel).not.toHaveBeenCalled();
  });

  it("creates new label and adds it to PR when none exists", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = await getOrCreateGroupLabel({
      octokit: mockOctokit as unknown as GroupLabelParams["octokit"],
      owner: "test-owner",
      repo: "test-repo",
      groupLabelEnabled: true,
      groupLabelPrefix: "tfaction:follow-up-pr-group/",
      prNumber: "123",
      tempDir: "/tmp/test",
    });

    expect(result).toBe("tfaction:follow-up-pr-group/123");
    expect(mockOctokit.rest.issues.createLabel).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      name: "tfaction:follow-up-pr-group/123",
    });
    expect(mockOctokit.rest.issues.addLabels).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      issue_number: 123,
      labels: ["tfaction:follow-up-pr-group/123"],
    });
  });

  it("handles 422 error (label already exists) gracefully", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const error = new Error("Validation Failed") as Error & { status: number };
    error.status = 422;
    mockOctokit.rest.issues.createLabel.mockRejectedValue(error);

    const result = await getOrCreateGroupLabel({
      octokit: mockOctokit as unknown as GroupLabelParams["octokit"],
      owner: "test-owner",
      repo: "test-repo",
      groupLabelEnabled: true,
      groupLabelPrefix: "tfaction:follow-up-pr-group/",
      prNumber: "123",
      tempDir: "/tmp/test",
    });

    expect(result).toBe("tfaction:follow-up-pr-group/123");
    expect(core.info).toHaveBeenCalledWith(
      "Label tfaction:follow-up-pr-group/123 already exists",
    );
  });

  it("re-throws non-422 errors", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const error = new Error("Server Error") as Error & { status: number };
    error.status = 500;
    mockOctokit.rest.issues.createLabel.mockRejectedValue(error);

    await expect(
      getOrCreateGroupLabel({
        octokit: mockOctokit as unknown as GroupLabelParams["octokit"],
        owner: "test-owner",
        repo: "test-repo",
        groupLabelEnabled: true,
        groupLabelPrefix: "tfaction:follow-up-pr-group/",
        prNumber: "123",
        tempDir: "/tmp/test",
      }),
    ).rejects.toThrow("Server Error");
  });

  it("adds label to PR when label exists but not in labels.txt", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue("some-other-label\n");

    const result = await getOrCreateGroupLabel({
      octokit: mockOctokit as unknown as GroupLabelParams["octokit"],
      owner: "test-owner",
      repo: "test-repo",
      groupLabelEnabled: true,
      groupLabelPrefix: "tfaction:follow-up-pr-group/",
      prNumber: "123",
      tempDir: "/tmp/test",
    });

    expect(result).toBe("tfaction:follow-up-pr-group/123");
    expect(mockOctokit.rest.issues.addLabels).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      issue_number: 123,
      labels: ["tfaction:follow-up-pr-group/123"],
    });
  });
});

describe("generatePRParams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultConfig = {
    follow_up_pr: {},
  } as unknown as Parameters<typeof generatePRParams>[0];

  const defaultTargetConfig = {
    working_directory: "infra/env/prod",
    target: "infra/env/prod",
  } as unknown as Parameters<typeof generatePRParams>[1];

  const defaultInput: GeneratePRParamsInput = {
    prNumber: "42",
    target: "infra/env/prod",
    tempDir: "",
    actor: "user1",
    prAuthor: "user2",
    runURL: "https://github.com/owner/repo/actions/runs/123",
  };

  it("generates branch name with correct format (slashes replaced with __)", () => {
    const result = generatePRParams(
      defaultConfig,
      defaultTargetConfig,
      defaultInput,
    );
    expect(result.branch).toMatch(
      /^follow-up-42-infra__env__prod-\d{8}T\d{6}$/,
    );
  });

  it("includes PR author and actor in assignees", () => {
    const result = generatePRParams(
      defaultConfig,
      defaultTargetConfig,
      defaultInput,
    );
    expect(result.assignees).toContain("user1");
    expect(result.assignees).toContain("user2");
  });

  it("excludes bot accounts ([bot] suffix) from assignees", () => {
    const result = generatePRParams(defaultConfig, defaultTargetConfig, {
      ...defaultInput,
      actor: "dependabot[bot]",
      prAuthor: "renovate[bot]",
    });
    expect(result.assignees).toEqual([]);
  });

  it("does not duplicate when actor === prAuthor", () => {
    const result = generatePRParams(defaultConfig, defaultTargetConfig, {
      ...defaultInput,
      actor: "user1",
      prAuthor: "user1",
    });
    expect(result.assignees).toEqual(["user1"]);
  });

  it("uses default PR title/body/comment when no template configured", () => {
    const result = generatePRParams(
      defaultConfig,
      defaultTargetConfig,
      defaultInput,
    );
    expect(result.prTitle).toBe("chore(infra/env/prod): follow up #42");
    expect(result.prBody).toContain("Follow up #42");
    expect(result.comment).toContain("terraform apply");
  });

  it("uses Handlebars template when configured", () => {
    const config = {
      follow_up_pr: {
        pull_request: {
          title: "Follow up {{target}} #{{pr_number}}",
          body: "Body for {{target}}",
          comment: "Comment for {{target}} by {{actor}}",
        },
      },
    } as unknown as Parameters<typeof generatePRParams>[0];

    const result = generatePRParams(config, defaultTargetConfig, defaultInput);
    expect(result.prTitle).toBe("Follow up infra/env/prod #42");
    expect(result.prBody).toBe("Body for infra/env/prod");
    expect(result.comment).toBe("Comment for infra/env/prod by user1");
  });

  it("reads and appends original PR body from pr.json", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        body: "Original PR body",
        assignees: [{ login: "reviewer1" }],
      }),
    );

    const result = generatePRParams(defaultConfig, defaultTargetConfig, {
      ...defaultInput,
      tempDir: "/tmp/test",
    });

    expect(result.prBody).toContain("Original PR body");
    expect(result.prBody).toContain("Original PR description");
  });

  it("handles missing pr.json", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = generatePRParams(defaultConfig, defaultTargetConfig, {
      ...defaultInput,
      tempDir: "/tmp/test",
    });

    expect(result.prBody).toContain("Follow up #42");
    expect(result.prBody).not.toContain("Original PR description");
  });

  it("handles invalid pr.json gracefully", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue("invalid json");

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = generatePRParams(defaultConfig, defaultTargetConfig, {
      ...defaultInput,
      tempDir: "/tmp/test",
    });

    expect(result.prTitle).toBe("chore(infra/env/prod): follow up #42");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to read or parse pr.json:",
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });
});

describe("createFailedPrsFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates .tfaction directory if it doesn't exist", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    createFailedPrsFile(
      "/workspace/infra",
      "42",
      "https://github.com",
      "owner/repo",
    );

    expect(fs.mkdirSync).toHaveBeenCalledWith("/workspace/infra/.tfaction", {
      recursive: true,
    });
  });

  it("creates failed-prs file with header if it doesn't exist", () => {
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(true) // tfactionDir exists
      .mockReturnValueOnce(false); // failedPrsFile doesn't exist

    createFailedPrsFile(
      "/workspace/infra",
      "42",
      "https://github.com",
      "owner/repo",
    );

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/workspace/infra/.tfaction/failed-prs",
      expect.stringContaining("This file is created and updated by tfaction"),
    );
  });

  it("appends PR URL to file", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);

    createFailedPrsFile(
      "/workspace/infra",
      "42",
      "https://github.com",
      "owner/repo",
    );

    expect(fs.appendFileSync).toHaveBeenCalledWith(
      "/workspace/infra/.tfaction/failed-prs",
      "https://github.com/owner/repo/pull/42\n",
    );
  });

  it("returns correct file path", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);

    const result = createFailedPrsFile(
      "/workspace/infra",
      "42",
      "https://github.com",
      "owner/repo",
    );

    expect(result).toBe("/workspace/infra/.tfaction/failed-prs");
  });
});

describe("postSkipCreateComment", () => {
  let mockExecutor: ReturnType<typeof createMockExecutor>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecutor = createMockExecutor();
  });

  const defaultParams = (): SkipCreateCommentParams => ({
    githubToken: "token",
    repository: "owner/repo",
    branch: "follow-up-42",
    prTitle: "chore: follow up",
    prNumber: "42",
    draftPr: false,
    groupLabelEnabled: false,
    groupLabel: "",
    target: "infra/prod",
    mentions: "@user1",
    executor: mockExecutor as unknown as SkipCreateCommentParams["executor"],
    workingDir: "/workspace",
  });

  it("calls github-comment with correct base args", async () => {
    await postSkipCreateComment(defaultParams());

    expect(mockExecutor.exec).toHaveBeenCalledWith(
      "github-comment",
      expect.arrayContaining(["post", "-k", "skip-create-follow-up-pr"]),
      expect.objectContaining({
        cwd: "/workspace",
        env: {
          GITHUB_TOKEN: "token",
          GH_COMMENT_CONFIG: "/mock/config/github-comment.yaml",
        },
      }),
    );
  });

  it("includes -d flag when draftPr is true", async () => {
    await postSkipCreateComment({
      ...defaultParams(),
      draftPr: true,
    });

    const callArgs = mockExecutor.exec.mock.calls[0];
    const varsArg = callArgs[1] as string[];
    const optsVar = varsArg.find((a: string) => a.startsWith("opts:"));
    expect(optsVar).toContain("-d");
  });

  it("includes -l flag when groupLabelEnabled and groupLabel set", async () => {
    await postSkipCreateComment({
      ...defaultParams(),
      groupLabelEnabled: true,
      groupLabel: "tfaction:follow-up-pr-group/42",
    });

    const callArgs = mockExecutor.exec.mock.calls[0];
    const varsArg = callArgs[1] as string[];
    const optsVar = varsArg.find((a: string) => a.startsWith("opts:"));
    expect(optsVar).toContain("-l");
    expect(optsVar).toContain("tfaction:follow-up-pr-group/42");
  });
});

describe("run", () => {
  let mockOctokit: MockOctokit;
  let mockExecutor: ReturnType<typeof createMockExecutor>;

  const defaultRunInput: RunInput = {
    githubToken: "test-token",
    securefixAppId: "",
    securefixAppPrivateKey: "",
    actor: "user1",
    prAuthor: "user2",
    target: "infra/env/prod",
    workingDir: "infra/env/prod",
    isApply: true,
    prNumber: "42",
    tempDir: "/tmp/test",
    repository: "owner/repo",
    runURL: "https://github.com/owner/repo/actions/runs/123",
    githubServerUrl: "https://github.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockOctokit = createMockOctokit();
    mockExecutor = createMockExecutor();

    vi.mocked(github.getOctokit).mockReturnValue(
      mockOctokit as unknown as ReturnType<typeof github.getOctokit>,
    );
    vi.mocked(lib.getConfig).mockResolvedValue({
      skip_create_pr: false,
      draft_pr: false,
      git_root_dir: "/workspace",
      workspace: "/workspace",
      label_prefixes: {
        target: "target:",
        tfmigrate: "tfmigrate:",
        skip: "skip:",
      },
      follow_up_pr: {},
      securefix_action: {},
    } as unknown as Awaited<ReturnType<typeof lib.getConfig>>);
    vi.mocked(lib.getJobType).mockReturnValue("terraform");
    vi.mocked(getTargetConfig).mockResolvedValue({
      working_directory: "infra/env/prod",
      target: "infra/env/prod",
    } as unknown as Awaited<ReturnType<typeof getTargetConfig>>);
    vi.mocked(aqua.NewExecutor).mockResolvedValue(
      mockExecutor as unknown as Awaited<ReturnType<typeof aqua.NewExecutor>>,
    );
    vi.mocked(commit.create).mockResolvedValue(
      "https://github.com/owner/repo/pull/99",
    );
    vi.mocked(fs.existsSync).mockReturnValue(false);
  });

  it("creates follow-up PR (happy path)", async () => {
    await run(defaultRunInput);

    expect(commit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        githubToken: "test-token",
        pr: expect.objectContaining({
          title: expect.stringContaining("follow up #42"),
        }),
      }),
    );
  });

  it("posts comment to original PR when followUpPrUrl is returned", async () => {
    await run(defaultRunInput);

    expect(mockExecutor.exec).toHaveBeenCalledWith(
      "github-comment",
      expect.arrayContaining(["post", "-k", "create-follow-up-pr"]),
      expect.objectContaining({
        env: {
          GITHUB_TOKEN: "test-token",
        },
      }),
    );
  });

  it("handles skip_create_pr mode", async () => {
    vi.mocked(lib.getConfig).mockResolvedValue({
      skip_create_pr: true,
      draft_pr: false,
      git_root_dir: "/workspace",
      workspace: "/workspace",
      label_prefixes: {
        target: "target:",
        tfmigrate: "tfmigrate:",
        skip: "skip:",
      },
      follow_up_pr: {},
      securefix_action: {},
    } as unknown as Awaited<ReturnType<typeof lib.getConfig>>);
    vi.mocked(commit.create).mockResolvedValue("");

    await run(defaultRunInput);

    expect(commit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pr: undefined,
      }),
    );

    // Should post skip comment
    expect(mockExecutor.exec).toHaveBeenCalledWith(
      "github-comment",
      expect.arrayContaining(["post", "-k", "skip-create-follow-up-pr"]),
      expect.any(Object),
    );
  });

  it('adds tfmigrate label when jobType === "tfmigrate"', async () => {
    vi.mocked(lib.getJobType).mockReturnValue("tfmigrate");

    await run(defaultRunInput);

    expect(commit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pr: expect.objectContaining({
          labels: expect.arrayContaining(["tfmigrate:infra/env/prod"]),
        }),
      }),
    );
  });
});
