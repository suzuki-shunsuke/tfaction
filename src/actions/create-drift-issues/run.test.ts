import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  run,
  listIssues,
  closeIssue,
  archiveIssue,
  titlePattern,
  type RunInput,
  type Logger,
  type GraphQLPaginator,
  type RunDependencies,
  type Issue,
} from "./run";
import type * as types from "../../lib/types";

describe("titlePattern", () => {
  it("matches valid drift issue titles", () => {
    const match = titlePattern.exec("Terraform Drift (aws/foo/dev)");
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe("aws/foo/dev");
  });

  it("extracts target from title", () => {
    const match = titlePattern.exec("Terraform Drift (gcp/prod/service)");
    expect(match?.[1]).toBe("gcp/prod/service");
  });

  it("does not match non-drift titles", () => {
    expect(titlePattern.exec("Some other issue")).toBeNull();
    expect(titlePattern.exec("Terraform Plan (aws/foo)")).toBeNull();
  });

  it("does not match partial drift titles", () => {
    expect(titlePattern.exec("Terraform Drift aws/foo")).toBeNull();
    expect(titlePattern.exec("Terraform Drift (aws/foo")).toBeNull();
  });

  it("matches targets with various characters", () => {
    const match = titlePattern.exec("Terraform Drift (aws-prod/foo_bar/123)");
    expect(match?.[1]).toBe("aws-prod/foo_bar/123");
  });

  it("does not match archived drift titles", () => {
    expect(
      titlePattern.exec("Archived Terraform Drift (aws/foo/dev)"),
    ).toBeNull();
  });
});

describe("listIssues", () => {
  const createMockLogger = (): Logger => ({
    info: vi.fn(),
    debug: vi.fn(),
  });

  const createMockGraphqlOctokit = (
    pages: Array<
      Array<{ number: number; title: string; state: string; url: string }>
    >,
  ): GraphQLPaginator => {
    return {
      graphql: {
        paginate: {
          iterator: vi.fn().mockImplementation(async function* () {
            for (const page of pages) {
              yield { search: { nodes: page } };
            }
          }),
        },
      },
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no issues exist", async () => {
    const graphqlOctokit = createMockGraphqlOctokit([[]]);
    const logger = createMockLogger();

    const result = await listIssues(graphqlOctokit, "owner/repo", logger);

    expect(result).toEqual([]);
  });

  it("parses issue titles correctly to extract target", async () => {
    const graphqlOctokit = createMockGraphqlOctokit([
      [
        {
          number: 1,
          title: "Terraform Drift (aws/foo/dev)",
          state: "OPEN",
          url: "https://github.com/owner/repo/issues/1",
        },
        {
          number: 2,
          title: "Terraform Drift (gcp/bar/prod)",
          state: "CLOSED",
          url: "https://github.com/owner/repo/issues/2",
        },
      ],
    ]);
    const logger = createMockLogger();

    const result = await listIssues(graphqlOctokit, "owner/repo", logger);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      number: 1,
      title: "Terraform Drift (aws/foo/dev)",
      state: "OPEN",
      url: "https://github.com/owner/repo/issues/1",
      target: "aws/foo/dev",
    });
    expect(result[1]).toEqual({
      number: 2,
      title: "Terraform Drift (gcp/bar/prod)",
      state: "CLOSED",
      url: "https://github.com/owner/repo/issues/2",
      target: "gcp/bar/prod",
    });
  });

  it("handles pagination with multiple pages", async () => {
    const graphqlOctokit = createMockGraphqlOctokit([
      [
        {
          number: 1,
          title: "Terraform Drift (aws/foo/dev)",
          state: "OPEN",
          url: "https://github.com/owner/repo/issues/1",
        },
      ],
      [
        {
          number: 2,
          title: "Terraform Drift (gcp/bar/prod)",
          state: "OPEN",
          url: "https://github.com/owner/repo/issues/2",
        },
      ],
    ]);
    const logger = createMockLogger();

    const result = await listIssues(graphqlOctokit, "owner/repo", logger);

    expect(result).toHaveLength(2);
    expect(result[0].target).toBe("aws/foo/dev");
    expect(result[1].target).toBe("gcp/bar/prod");
  });

  it("handles malformed issue titles", async () => {
    const graphqlOctokit = createMockGraphqlOctokit([
      [
        {
          number: 1,
          title: "Terraform Drift (aws/foo/dev)",
          state: "OPEN",
          url: "https://github.com/owner/repo/issues/1",
        },
        {
          number: 2,
          title: "Some other issue about Terraform Drift",
          state: "OPEN",
          url: "https://github.com/owner/repo/issues/2",
        },
        {
          number: 3,
          title: "Archived Terraform Drift (old/target)",
          state: "CLOSED",
          url: "https://github.com/owner/repo/issues/3",
        },
      ],
    ]);
    const logger = createMockLogger();

    const result = await listIssues(graphqlOctokit, "owner/repo", logger);

    expect(result).toHaveLength(1);
    expect(result[0].target).toBe("aws/foo/dev");
  });
});

describe("closeIssue", () => {
  it("calls octokit.rest.issues.update with state: closed", async () => {
    const mockUpdate = vi.fn().mockResolvedValue({});
    const octokit = {
      rest: {
        issues: {
          update: mockUpdate,
        },
      },
    } as unknown as ReturnType<typeof import("@actions/github").getOctokit>;

    await closeIssue(octokit, "owner", "repo", 123);

    expect(mockUpdate).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 123,
      state: "closed",
    });
  });
});

describe("archiveIssue", () => {
  it("calls octokit.rest.issues.update with new title and closed state", async () => {
    const mockUpdate = vi.fn().mockResolvedValue({});
    const octokit = {
      rest: {
        issues: {
          update: mockUpdate,
        },
      },
    } as unknown as ReturnType<typeof import("@actions/github").getOctokit>;

    await archiveIssue(
      octokit,
      "owner",
      "repo",
      "Terraform Drift (aws/foo/dev)",
      123,
    );

    expect(mockUpdate).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 123,
      title: "Archived Terraform Drift (aws/foo/dev)",
      state: "closed",
    });
  });
});

describe("run", () => {
  const createMockOctokit = () => ({
    rest: {
      issues: {
        update: vi.fn().mockResolvedValue({}),
        create: vi
          .fn()
          .mockResolvedValue({ data: { number: 1, html_url: "..." } }),
      },
    },
  });

  const createMockGraphqlOctokit = (issues: Issue[]): GraphQLPaginator => ({
    graphql: {
      paginate: {
        iterator: vi.fn().mockImplementation(async function* () {
          yield {
            search: {
              nodes: issues.map((i) => ({
                number: i.number,
                title: i.title,
                state: i.state,
                url: i.url,
              })),
            },
          };
        }),
      },
    },
  });

  const createMockLogger = (): Logger => ({
    info: vi.fn(),
    debug: vi.fn(),
  });

  const createMockConfig = (
    driftDetection?: types.Config["drift_detection"],
  ): types.Config =>
    ({
      drift_detection: driftDetection,
      working_directory_file: "tfaction.yaml",
      git_root_dir: "/workspace",
      target_groups: [{ working_directory: "aws" }],
      replace_target: undefined,
      config_path: "/workspace/tfaction-root.yaml",
    }) as types.Config;

  const createMockDeps = (
    workingDirFiles: string[] = [],
    targetDriftEnabled: boolean = true,
  ): RunDependencies => ({
    createIssue: vi.fn().mockResolvedValue({
      url: "https://github.com/owner/repo/issues/new",
      number: 100,
      state: "open",
      title: "Terraform Drift (new/target)",
      target: "new/target",
    }),
    listWorkingDirFiles: vi.fn().mockResolvedValue(workingDirFiles),
    getTargetGroup: vi.fn().mockResolvedValue({
      target: "mock/target",
      workingDir: "mock",
      group: { working_directory: "mock" },
    }),
    readTargetConfig: vi.fn().mockReturnValue({
      drift_detection: { enabled: targetDriftEnabled },
    }),
    checkDriftDetectionEnabled: vi.fn().mockReturnValue(targetDriftEnabled),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns undefined when drift detection disabled", async () => {
    const octokit = createMockOctokit();
    const graphqlOctokit = createMockGraphqlOctokit([]);
    const logger = createMockLogger();
    const config = createMockConfig(undefined);
    const deps = createMockDeps();

    const input: RunInput = {
      octokit: octokit as unknown as RunInput["octokit"],
      graphqlOctokit,
      repoOwner: "owner",
      repoName: "repo",
      config,
      logger,
    };

    const result = await run(input, "gh-token", deps);

    expect(result).toBeUndefined();
    expect(logger.info).toHaveBeenCalledWith("drift detection is disabled");
  });

  it("creates issues for targets without existing issues", async () => {
    const octokit = createMockOctokit();
    const graphqlOctokit = createMockGraphqlOctokit([]);
    const logger = createMockLogger();
    const config = createMockConfig({ minimum_detection_interval: 168 });
    const deps = createMockDeps(
      ["aws/foo/tfaction.yaml", "aws/bar/tfaction.yaml"],
      true,
    );

    const input: RunInput = {
      octokit: octokit as unknown as RunInput["octokit"],
      graphqlOctokit,
      repoOwner: "owner",
      repoName: "repo",
      config,
      logger,
    };

    await run(input, "gh-token", deps);

    // Should have called createIssue for targets without existing issues
    expect(deps.createIssue).toHaveBeenCalled();
  });

  it("does not create issues for targets with existing issues", async () => {
    const octokit = createMockOctokit();
    const existingIssues: Issue[] = [
      {
        number: 1,
        title: "Terraform Drift (aws/foo)",
        state: "OPEN",
        url: "https://github.com/owner/repo/issues/1",
        target: "aws/foo",
      },
    ];
    const graphqlOctokit = createMockGraphqlOctokit(existingIssues);
    const logger = createMockLogger();
    const config = createMockConfig({ minimum_detection_interval: 168 });
    const deps = createMockDeps(["aws/foo/tfaction.yaml"], true);

    const input: RunInput = {
      octokit: octokit as unknown as RunInput["octokit"],
      graphqlOctokit,
      repoOwner: "owner",
      repoName: "repo",
      config,
      logger,
    };

    await run(input, "gh-token", deps);

    // Should not have called createIssue since issue already exists
    expect(deps.createIssue).not.toHaveBeenCalled();
  });

  it("archives issues for targets that no longer exist", async () => {
    const octokit = createMockOctokit();
    const existingIssues: Issue[] = [
      {
        number: 1,
        title: "Terraform Drift (deleted/target)",
        state: "OPEN",
        url: "https://github.com/owner/repo/issues/1",
        target: "deleted/target",
      },
    ];
    const graphqlOctokit = createMockGraphqlOctokit(existingIssues);
    const logger = createMockLogger();
    const config = createMockConfig({ minimum_detection_interval: 168 });
    // No working dir files means no targets exist
    const deps = createMockDeps([], true);

    const input: RunInput = {
      octokit: octokit as unknown as RunInput["octokit"],
      graphqlOctokit,
      repoOwner: "owner",
      repoName: "repo",
      config,
      logger,
    };

    await run(input, "gh-token", deps);

    // Should have archived the orphaned issue
    expect(octokit.rest.issues.update).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 1,
      title: "Archived Terraform Drift (deleted/target)",
      state: "closed",
    });
  });

  it("handles empty target list", async () => {
    const octokit = createMockOctokit();
    const graphqlOctokit = createMockGraphqlOctokit([]);
    const logger = createMockLogger();
    const config = createMockConfig({ minimum_detection_interval: 168 });
    const deps = createMockDeps([], true);

    const input: RunInput = {
      octokit: octokit as unknown as RunInput["octokit"],
      graphqlOctokit,
      repoOwner: "owner",
      repoName: "repo",
      config,
      logger,
    };

    const result = await run(input, "gh-token", deps);

    expect(result).toBeUndefined();
    expect(deps.createIssue).not.toHaveBeenCalled();
  });

  it("does not archive issues when target exists with drift enabled", async () => {
    const octokit = createMockOctokit();
    const existingIssues: Issue[] = [
      {
        number: 1,
        title: "Terraform Drift (aws/foo)",
        state: "OPEN",
        url: "https://github.com/owner/repo/issues/1",
        target: "aws/foo",
      },
    ];
    const graphqlOctokit = createMockGraphqlOctokit(existingIssues);
    const logger = createMockLogger();
    const config = createMockConfig({ minimum_detection_interval: 168 });
    const deps = createMockDeps(["aws/foo/tfaction.yaml"], true);

    const input: RunInput = {
      octokit: octokit as unknown as RunInput["octokit"],
      graphqlOctokit,
      repoOwner: "owner",
      repoName: "repo",
      config,
      logger,
    };

    await run(input, "gh-token", deps);

    // Should not have called update (archive) since target exists with drift enabled
    expect(octokit.rest.issues.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("Archived"),
      }),
    );
  });
});
