import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseCommentMeta,
  buildCELContext,
  run,
  DEFAULT_CONDITION,
  type RunInput,
  type Logger,
} from "./run";

describe("parseCommentMeta", () => {
  it("extracts valid metadata from comment body", () => {
    const body = `some text
<!-- github-comment: {"SHA1":"abc123","Program":"tfcmt","Command":"plan","JobName":"plan","PRNumber":42,"Target":"aws/dev","WorkflowName":"ci","Vars":{}} -->
more text`;
    const meta = parseCommentMeta(body);
    expect(meta).toEqual({
      SHA1: "abc123",
      Program: "tfcmt",
      Command: "plan",
      JobName: "plan",
      PRNumber: 42,
      Target: "aws/dev",
      WorkflowName: "ci",
      Vars: {},
    });
  });

  it("returns undefined for comment without metadata", () => {
    const body = "This is a plain comment with no metadata";
    expect(parseCommentMeta(body)).toBeUndefined();
  });

  it("returns undefined for invalid JSON", () => {
    const body = "<!-- github-comment: {invalid json} -->";
    expect(parseCommentMeta(body)).toBeUndefined();
  });
});

describe("buildCELContext", () => {
  it("builds correct context with metadata", () => {
    const meta = {
      SHA1: "abc123",
      Program: "tfcmt",
      Command: "plan",
      JobName: "plan-job",
      PRNumber: 42,
      Target: "aws/dev",
      WorkflowName: "ci",
      Vars: { key: "value" },
    };
    const context = buildCELContext(meta, "def456");
    expect(context).toEqual({
      Comment: {
        HasMeta: true,
        Meta: {
          SHA1: "abc123",
          Program: "tfcmt",
          Command: "plan",
          JobName: "plan-job",
          PRNumber: 42,
          Target: "aws/dev",
          WorkflowName: "ci",
          Vars: { key: "value" },
        },
      },
      Commit: { SHA1: "def456" },
    });
  });

  it("builds context with defaults when no metadata", () => {
    const context = buildCELContext(undefined, "def456");
    expect(context).toEqual({
      Comment: {
        HasMeta: false,
        Meta: {
          SHA1: "",
          Program: "",
          Command: "",
          JobName: "",
          PRNumber: 0,
          Target: "",
          WorkflowName: "",
          Vars: {},
        },
      },
      Commit: { SHA1: "def456" },
    });
  });
});

describe("run", () => {
  const createMockOctokit = () => ({
    graphql: vi.fn(),
  });

  const createMockLogger = (): Logger => ({
    info: vi.fn(),
    debug: vi.fn(),
  });

  const makeComment = (
    id: string,
    body: string,
    isMinimized: boolean = false,
  ) => ({
    id,
    body,
    isMinimized,
  });

  const makeMetaComment = (
    id: string,
    sha: string,
    program: string = "tfcmt",
    command: string = "plan",
    isMinimized: boolean = false,
  ) =>
    makeComment(
      id,
      `Plan result\n<!-- github-comment: {"SHA1":"${sha}","Program":"${program}","Command":"${command}","JobName":"job","PRNumber":1,"Target":"aws/dev","WorkflowName":"ci","Vars":{}} -->`,
      isMinimized,
    );

  const graphqlPage = (
    nodes: Array<{ id: string; body: string; isMinimized: boolean }>,
    hasNextPage: boolean = false,
    endCursor: string | null = null,
  ) => ({
    repository: {
      pullRequest: {
        comments: {
          nodes,
          pageInfo: { endCursor, hasNextPage },
        },
      },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hides comments matching condition (different SHA, not apply)", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();

    octokit.graphql
      .mockResolvedValueOnce(
        graphqlPage([
          makeMetaComment("c1", "old-sha", "tfcmt", "plan"),
          makeMetaComment("c2", "old-sha", "github-comment", "post"),
        ]),
      )
      .mockResolvedValue({});

    const input: RunInput = {
      octokit: octokit as unknown as RunInput["octokit"],
      repoOwner: "owner",
      repoName: "repo",
      prNumber: 1,
      commitSHA: "new-sha",
      ifCondition: DEFAULT_CONDITION,
      logger,
    };

    const result = await run(input);
    expect(result.hiddenCount).toBe(2);
    expect(result.totalCount).toBe(2);
  });

  it("skips apply comments (Program=tfcmt, Command=apply)", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();

    octokit.graphql
      .mockResolvedValueOnce(
        graphqlPage([
          makeMetaComment("c1", "old-sha", "tfcmt", "apply"),
          makeMetaComment("c2", "old-sha", "tfcmt", "plan"),
        ]),
      )
      .mockResolvedValue({});

    const input: RunInput = {
      octokit: octokit as unknown as RunInput["octokit"],
      repoOwner: "owner",
      repoName: "repo",
      prNumber: 1,
      commitSHA: "new-sha",
      ifCondition: DEFAULT_CONDITION,
      logger,
    };

    const result = await run(input);
    expect(result.hiddenCount).toBe(1);
    expect(result.totalCount).toBe(2);
  });

  it("skips comments with same SHA as current", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();

    octokit.graphql.mockResolvedValueOnce(
      graphqlPage([
        makeMetaComment("c1", "current-sha", "tfcmt", "plan"),
        makeMetaComment("c2", "old-sha", "tfcmt", "plan"),
      ]),
    );
    octokit.graphql.mockResolvedValue({});

    const input: RunInput = {
      octokit: octokit as unknown as RunInput["octokit"],
      repoOwner: "owner",
      repoName: "repo",
      prNumber: 1,
      commitSHA: "current-sha",
      ifCondition: DEFAULT_CONDITION,
      logger,
    };

    const result = await run(input);
    expect(result.hiddenCount).toBe(1);
    expect(result.totalCount).toBe(2);
  });

  it("skips already-minimized comments", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();

    octokit.graphql.mockResolvedValueOnce(
      graphqlPage([
        makeMetaComment("c1", "old-sha", "tfcmt", "plan", true),
        makeMetaComment("c2", "old-sha", "tfcmt", "plan", false),
      ]),
    );
    octokit.graphql.mockResolvedValue({});

    const input: RunInput = {
      octokit: octokit as unknown as RunInput["octokit"],
      repoOwner: "owner",
      repoName: "repo",
      prNumber: 1,
      commitSHA: "new-sha",
      ifCondition: DEFAULT_CONDITION,
      logger,
    };

    const result = await run(input);
    expect(result.hiddenCount).toBe(1);
    expect(result.totalCount).toBe(1);
  });

  it("skips comments without metadata (default condition)", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();

    octokit.graphql.mockResolvedValueOnce(
      graphqlPage([
        makeComment("c1", "A plain comment without metadata"),
        makeMetaComment("c2", "old-sha", "tfcmt", "plan"),
      ]),
    );
    octokit.graphql.mockResolvedValue({});

    const input: RunInput = {
      octokit: octokit as unknown as RunInput["octokit"],
      repoOwner: "owner",
      repoName: "repo",
      prNumber: 1,
      commitSHA: "new-sha",
      ifCondition: DEFAULT_CONDITION,
      logger,
    };

    const result = await run(input);
    expect(result.hiddenCount).toBe(1);
    expect(result.totalCount).toBe(2);
  });

  it("handles empty PR (no comments)", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();

    octokit.graphql.mockResolvedValueOnce(graphqlPage([]));

    const input: RunInput = {
      octokit: octokit as unknown as RunInput["octokit"],
      repoOwner: "owner",
      repoName: "repo",
      prNumber: 1,
      commitSHA: "new-sha",
      ifCondition: DEFAULT_CONDITION,
      logger,
    };

    const result = await run(input);
    expect(result.hiddenCount).toBe(0);
    expect(result.totalCount).toBe(0);
  });

  it("handles pagination", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();

    // First page
    octokit.graphql.mockResolvedValueOnce(
      graphqlPage(
        [makeMetaComment("c1", "old-sha", "tfcmt", "plan")],
        true,
        "cursor1",
      ),
    );
    // Second page
    octokit.graphql.mockResolvedValueOnce(
      graphqlPage([makeMetaComment("c2", "old-sha", "tfcmt", "plan")]),
    );
    // minimizeComment calls
    octokit.graphql.mockResolvedValue({});

    const input: RunInput = {
      octokit: octokit as unknown as RunInput["octokit"],
      repoOwner: "owner",
      repoName: "repo",
      prNumber: 1,
      commitSHA: "new-sha",
      ifCondition: DEFAULT_CONDITION,
      logger,
    };

    const result = await run(input);
    expect(result.hiddenCount).toBe(2);
    expect(result.totalCount).toBe(2);
  });

  it("supports custom if condition", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();

    octokit.graphql
      .mockResolvedValueOnce(
        graphqlPage([
          makeMetaComment("c1", "old-sha", "tfcmt", "plan"),
          makeMetaComment("c2", "old-sha", "tfcmt", "apply"),
        ]),
      )
      .mockResolvedValue({});

    // Custom condition that hides all comments with metadata (including apply)
    const input: RunInput = {
      octokit: octokit as unknown as RunInput["octokit"],
      repoOwner: "owner",
      repoName: "repo",
      prNumber: 1,
      commitSHA: "new-sha",
      ifCondition: "Comment.HasMeta",
      logger,
    };

    const result = await run(input);
    expect(result.hiddenCount).toBe(2);
    expect(result.totalCount).toBe(2);
  });
});
