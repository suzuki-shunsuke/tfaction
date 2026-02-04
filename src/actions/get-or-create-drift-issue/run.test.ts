import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  run,
  getIssue,
  type Logger,
  type GraphQLPaginator,
  type RunDependencies,
} from "./run";
import type * as types from "../../lib/types";

const createMockLogger = (): Logger => ({
  info: vi.fn(),
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
  overrides?: Partial<RunDependencies>,
): RunDependencies => ({
  getTargetGroup: vi.fn().mockResolvedValue({
    target: "aws/foo",
    workingDir: "aws/foo",
    group: { working_directory: "aws" },
  }),
  readTargetConfig: vi.fn().mockReturnValue({}),
  checkDriftDetectionEnabled: vi.fn().mockReturnValue(true),
  createIssue: vi.fn().mockResolvedValue({
    url: "https://github.com/owner/repo/issues/42",
    number: 42,
    state: "open",
  }),
  ...overrides,
});

describe("getIssue", () => {
  it("returns undefined when no issues exist", async () => {
    const graphqlOctokit = createMockGraphqlOctokit([[]]);

    const result = await getIssue("aws/foo", graphqlOctokit, "owner/repo");

    expect(result).toBeUndefined();
  });

  it("returns matching issue when title matches exactly", async () => {
    const graphqlOctokit = createMockGraphqlOctokit([
      [
        {
          number: 1,
          title: "Terraform Drift (aws/foo)",
          state: "OPEN",
          url: "https://github.com/owner/repo/issues/1",
        },
      ],
    ]);

    const result = await getIssue("aws/foo", graphqlOctokit, "owner/repo");

    expect(result).toEqual({
      number: 1,
      title: "Terraform Drift (aws/foo)",
      state: "OPEN",
      url: "https://github.com/owner/repo/issues/1",
    });
  });

  it("skips issues with non-matching titles", async () => {
    const graphqlOctokit = createMockGraphqlOctokit([
      [
        {
          number: 1,
          title: "Terraform Drift (aws/bar)",
          state: "OPEN",
          url: "https://github.com/owner/repo/issues/1",
        },
        {
          number: 2,
          title: "Terraform Drift (aws/foo)",
          state: "CLOSED",
          url: "https://github.com/owner/repo/issues/2",
        },
      ],
    ]);

    const result = await getIssue("aws/foo", graphqlOctokit, "owner/repo");

    expect(result).toEqual({
      number: 2,
      title: "Terraform Drift (aws/foo)",
      state: "CLOSED",
      url: "https://github.com/owner/repo/issues/2",
    });
  });

  it("handles pagination across multiple pages", async () => {
    const graphqlOctokit = createMockGraphqlOctokit([
      [
        {
          number: 1,
          title: "Terraform Drift (aws/bar)",
          state: "OPEN",
          url: "https://github.com/owner/repo/issues/1",
        },
      ],
      [
        {
          number: 2,
          title: "Terraform Drift (aws/foo)",
          state: "OPEN",
          url: "https://github.com/owner/repo/issues/2",
        },
      ],
    ]);

    const result = await getIssue("aws/foo", graphqlOctokit, "owner/repo");

    expect(result).toEqual({
      number: 2,
      title: "Terraform Drift (aws/foo)",
      state: "OPEN",
      url: "https://github.com/owner/repo/issues/2",
    });
  });
});

describe("run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns undefined when drift_detection is falsy in config", async () => {
    const logger = createMockLogger();
    const graphqlOctokit = createMockGraphqlOctokit([]);
    const deps = createMockDeps();

    const result = await run(
      {
        config: createMockConfig(undefined),
        ghToken: "token",
        repo: "owner/repo",
        graphqlOctokit,
        logger,
      },
      deps,
    );

    expect(result).toBeUndefined();
    expect(logger.info).toHaveBeenCalledWith("drift detection is disabled");
  });

  it("throws when repo_owner and repo_name cannot be resolved", async () => {
    const logger = createMockLogger();
    const graphqlOctokit = createMockGraphqlOctokit([]);
    const deps = createMockDeps();

    await expect(
      run(
        {
          config: createMockConfig({ minimum_detection_interval: 168 }),
          ghToken: "token",
          repo: "",
          graphqlOctokit,
          logger,
        },
        deps,
      ),
    ).rejects.toThrow("repo_owner and repo_name are required");
  });

  it("throws when ghToken is empty", async () => {
    const logger = createMockLogger();
    const graphqlOctokit = createMockGraphqlOctokit([[]]);
    const deps = createMockDeps();

    await expect(
      run(
        {
          config: createMockConfig({ minimum_detection_interval: 168 }),
          ghToken: "",
          repo: "owner/repo",
          graphqlOctokit,
          logger,
        },
        deps,
      ),
    ).rejects.toThrow("GITHUB_TOKEN is required");
  });

  it("returns undefined when drift detection is disabled for the target", async () => {
    const logger = createMockLogger();
    const graphqlOctokit = createMockGraphqlOctokit([]);
    const deps = createMockDeps({
      checkDriftDetectionEnabled: vi.fn().mockReturnValue(false),
    });

    const result = await run(
      {
        config: createMockConfig({ minimum_detection_interval: 168 }),
        ghToken: "token",
        repo: "owner/repo",
        graphqlOctokit,
        logger,
      },
      deps,
    );

    expect(result).toBeUndefined();
    expect(logger.info).toHaveBeenCalledWith("drift detection is disabled");
  });

  it("returns existing issue if found", async () => {
    const logger = createMockLogger();
    const graphqlOctokit = createMockGraphqlOctokit([
      [
        {
          number: 10,
          title: "Terraform Drift (aws/foo)",
          state: "OPEN",
          url: "https://github.com/owner/repo/issues/10",
        },
      ],
    ]);
    const deps = createMockDeps();

    const result = await run(
      {
        config: createMockConfig({ minimum_detection_interval: 168 }),
        ghToken: "token",
        repo: "owner/repo",
        graphqlOctokit,
        logger,
      },
      deps,
    );

    expect(result).toEqual({
      number: 10,
      state: "OPEN",
      url: "https://github.com/owner/repo/issues/10",
    });
    expect(deps.createIssue).not.toHaveBeenCalled();
  });

  it("calls createIssue when no existing issue found", async () => {
    const logger = createMockLogger();
    const graphqlOctokit = createMockGraphqlOctokit([[]]);
    const deps = createMockDeps();

    const result = await run(
      {
        config: createMockConfig({ minimum_detection_interval: 168 }),
        ghToken: "token",
        repo: "owner/repo",
        graphqlOctokit,
        logger,
      },
      deps,
    );

    expect(deps.createIssue).toHaveBeenCalledWith(
      "aws/foo",
      "token",
      "owner",
      "repo",
    );
    expect(result).toEqual({
      number: 42,
      state: "open",
      url: "https://github.com/owner/repo/issues/42",
    });
  });

  it("uses drift_detection.issue_repo_owner/issue_repo_name from config when set", async () => {
    const logger = createMockLogger();
    const graphqlOctokit = createMockGraphqlOctokit([[]]);
    const deps = createMockDeps();

    await run(
      {
        config: createMockConfig({
          minimum_detection_interval: 168,
          issue_repo_owner: "custom-owner",
          issue_repo_name: "custom-repo",
        }),
        ghToken: "token",
        repo: "default-owner/default-repo",
        graphqlOctokit,
        logger,
      },
      deps,
    );

    expect(deps.createIssue).toHaveBeenCalledWith(
      "aws/foo",
      "token",
      "custom-owner",
      "custom-repo",
    );
  });

  it("falls back to splitting repo input when config values not set", async () => {
    const logger = createMockLogger();
    const graphqlOctokit = createMockGraphqlOctokit([[]]);
    const deps = createMockDeps();

    await run(
      {
        config: createMockConfig({ minimum_detection_interval: 168 }),
        ghToken: "token",
        repo: "fallback-owner/fallback-repo",
        graphqlOctokit,
        logger,
      },
      deps,
    );

    expect(deps.createIssue).toHaveBeenCalledWith(
      "aws/foo",
      "token",
      "fallback-owner",
      "fallback-repo",
    );
  });
});
