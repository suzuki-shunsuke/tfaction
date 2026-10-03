import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getDeadline,
  run,
  titlePattern,
  type RunInput,
  type Logger,
} from "./run";

describe("getDeadline", () => {
  it("returns empty string when durationHours is 0", () => {
    const now = new Date("2024-01-15T10:00:00Z");
    expect(getDeadline(now, 0)).toBe("");
  });

  it("calculates deadline 24 hours ago", () => {
    const now = new Date("2024-01-15T10:00:00Z");
    const result = getDeadline(now, 24);
    expect(result).toBe("2024-01-14T10:00:00+00:00");
  });

  it("calculates deadline 48 hours ago", () => {
    const now = new Date("2024-01-15T12:30:45Z");
    const result = getDeadline(now, 48);
    expect(result).toBe("2024-01-13T12:30:45+00:00");
  });

  it("handles fractional hours", () => {
    const now = new Date("2024-01-15T12:00:00Z");
    const result = getDeadline(now, 1.5); // 1.5 hours = 90 minutes
    expect(result).toBe("2024-01-15T10:30:00+00:00");
  });
});

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
});

describe("run", () => {
  const createMockOctokit = () => ({
    graphql: vi.fn(),
    rest: {
      issues: {
        update: vi.fn(),
      },
    },
  });

  const createMockLogger = (): Logger => ({
    info: vi.fn(),
    debug: vi.fn(),
    notice: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty result when drift_detection is not configured", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    const input: RunInput = {
      driftDetection: undefined,
      octokit: octokit as unknown as RunInput["octokit"],
      targets: new Map(),
      repoOwner: "owner",
      repoName: "repo",
      now: new Date(),
      serverUrl: "https://github.com",
      logger,
    };

    const result = await run(input);

    expect(result.hasIssues).toBe(false);
    expect(result.issues).toEqual([]);
    expect(octokit.graphql).not.toHaveBeenCalled();
  });

  it("returns empty result when no issues found", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.graphql.mockResolvedValue({
      search: {
        nodes: [],
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
        },
      },
    });

    const input: RunInput = {
      driftDetection: {
        minimum_detection_interval: 24,
        num_of_issues: 5,
      },
      octokit: octokit as unknown as RunInput["octokit"],
      targets: new Map([["aws/foo/dev", "ubuntu-latest"]]),
      repoOwner: "owner",
      repoName: "repo",
      now: new Date("2024-01-15T10:00:00Z"),
      serverUrl: "https://github.com",
      logger,
    };

    const result = await run(input);

    expect(result.hasIssues).toBe(false);
    expect(result.issues).toEqual([]);
  });

  it("returns issues with runs_on when target exists", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.graphql.mockResolvedValue({
      search: {
        nodes: [
          {
            number: 123,
            title: "Terraform Drift (aws/foo/dev)",
            state: "OPEN",
          },
          {
            number: 456,
            title: "Terraform Drift (gcp/bar/prod)",
            state: "OPEN",
          },
        ],
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
        },
      },
    });

    const targets = new Map([
      ["aws/foo/dev", "ubuntu-latest"],
      ["gcp/bar/prod", '["self-hosted", "linux"]'],
    ]);

    const input: RunInput = {
      driftDetection: {
        minimum_detection_interval: 24,
        num_of_issues: 10,
      },
      octokit: octokit as unknown as RunInput["octokit"],
      targets,
      repoOwner: "owner",
      repoName: "repo",
      now: new Date("2024-01-15T10:00:00Z"),
      serverUrl: "https://github.com",
      logger,
    };

    const result = await run(input);

    expect(result.hasIssues).toBe(true);
    expect(result.issues).toHaveLength(2);
    expect(result.issues[0]).toEqual({
      number: 123,
      title: "Terraform Drift (aws/foo/dev)",
      target: "aws/foo/dev",
      state: "open",
      runs_on: "ubuntu-latest",
    });
    expect(result.issues[1]).toEqual({
      number: 456,
      title: "Terraform Drift (gcp/bar/prod)",
      target: "gcp/bar/prod",
      state: "open",
      runs_on: '["self-hosted", "linux"]',
    });
  });

  it("archives issues when target does not exist", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.graphql.mockResolvedValue({
      search: {
        nodes: [
          {
            number: 789,
            title: "Terraform Drift (deleted/target)",
            state: "OPEN",
          },
        ],
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
        },
      },
    });
    octokit.rest.issues.update.mockResolvedValue({});

    const input: RunInput = {
      driftDetection: {
        minimum_detection_interval: 24,
        num_of_issues: 10,
      },
      octokit: octokit as unknown as RunInput["octokit"],
      targets: new Map(), // No targets
      repoOwner: "owner",
      repoName: "repo",
      now: new Date("2024-01-15T10:00:00Z"),
      serverUrl: "https://github.com",
      logger,
    };

    const result = await run(input);

    expect(result.hasIssues).toBe(false);
    expect(result.issues).toEqual([]);
    expect(octokit.rest.issues.update).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 789,
      state: "closed",
      title: "Archived Terraform Drift (deleted/target)",
    });
  });

  it("handles mixed issues (some with targets, some without)", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.graphql.mockResolvedValue({
      search: {
        nodes: [
          {
            number: 1,
            title: "Terraform Drift (aws/foo/dev)",
            state: "OPEN",
          },
          {
            number: 2,
            title: "Terraform Drift (deleted/target)",
            state: "OPEN",
          },
          {
            number: 3,
            title: "Terraform Drift (gcp/bar/prod)",
            state: "CLOSED",
          },
        ],
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
        },
      },
    });
    octokit.rest.issues.update.mockResolvedValue({});

    const targets = new Map([
      ["aws/foo/dev", "ubuntu-latest"],
      ["gcp/bar/prod", "self-hosted"],
    ]);

    const input: RunInput = {
      driftDetection: {
        minimum_detection_interval: 24,
        num_of_issues: 10,
      },
      octokit: octokit as unknown as RunInput["octokit"],
      targets,
      repoOwner: "owner",
      repoName: "repo",
      now: new Date("2024-01-15T10:00:00Z"),
      serverUrl: "https://github.com",
      logger,
    };

    const result = await run(input);

    expect(result.hasIssues).toBe(true);
    expect(result.issues).toHaveLength(2);
    expect(result.issues.map((i) => i.number)).toEqual([1, 3]);
    expect(octokit.rest.issues.update).toHaveBeenCalledTimes(1);
    expect(octokit.rest.issues.update).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 2,
      state: "closed",
      title: "Archived Terraform Drift (deleted/target)",
    });
  });

  it("uses num_of_issues default of 1 when not specified", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.graphql.mockResolvedValue({
      search: {
        nodes: [
          {
            number: 1,
            title: "Terraform Drift (aws/foo/dev)",
            state: "OPEN",
          },
          {
            number: 2,
            title: "Terraform Drift (aws/bar/prod)",
            state: "OPEN",
          },
        ],
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
        },
      },
    });

    const targets = new Map([
      ["aws/foo/dev", "ubuntu-latest"],
      ["aws/bar/prod", "ubuntu-latest"],
    ]);

    const input: RunInput = {
      driftDetection: {
        minimum_detection_interval: 24,
        // num_of_issues not specified
      },
      octokit: octokit as unknown as RunInput["octokit"],
      targets,
      repoOwner: "owner",
      repoName: "repo",
      now: new Date("2024-01-15T10:00:00Z"),
      serverUrl: "https://github.com",
      logger,
    };

    const result = await run(input);

    // Should only return 1 issue (the default)
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].number).toBe(1);
  });

  it("skips issues with non-matching title pattern", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.graphql.mockResolvedValue({
      search: {
        nodes: [
          {
            number: 1,
            title: "Terraform Drift (aws/foo/dev)",
            state: "OPEN",
          },
          {
            number: 2,
            title: "Some other issue mentioning Terraform Drift",
            state: "OPEN",
          },
        ],
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
        },
      },
    });

    const targets = new Map([["aws/foo/dev", "ubuntu-latest"]]);

    const input: RunInput = {
      driftDetection: {
        minimum_detection_interval: 24,
        num_of_issues: 10,
      },
      octokit: octokit as unknown as RunInput["octokit"],
      targets,
      repoOwner: "owner",
      repoName: "repo",
      now: new Date("2024-01-15T10:00:00Z"),
      serverUrl: "https://github.com",
      logger,
    };

    const result = await run(input);

    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].number).toBe(1);
  });

  it("handles no deadline when minimum_detection_interval is 0", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();
    octokit.graphql.mockResolvedValue({
      search: {
        nodes: [],
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
        },
      },
    });

    const input: RunInput = {
      driftDetection: {
        minimum_detection_interval: 0,
        num_of_issues: 10,
      },
      octokit: octokit as unknown as RunInput["octokit"],
      targets: new Map(),
      repoOwner: "owner",
      repoName: "repo",
      now: new Date("2024-01-15T10:00:00Z"),
      serverUrl: "https://github.com",
      logger,
    };

    await run(input);

    // Verify graphql was called with search query without deadline filter
    expect(octokit.graphql).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        searchQuery: expect.not.stringContaining("updated:<"),
      }),
    );
  });

  it("handles pagination in GraphQL results", async () => {
    const octokit = createMockOctokit();
    const logger = createMockLogger();

    // First page
    octokit.graphql.mockResolvedValueOnce({
      search: {
        nodes: [
          {
            number: 1,
            title: "Terraform Drift (aws/foo/dev)",
            state: "OPEN",
          },
        ],
        pageInfo: {
          endCursor: "cursor1",
          hasNextPage: true,
        },
      },
    });

    // Second page
    octokit.graphql.mockResolvedValueOnce({
      search: {
        nodes: [
          {
            number: 2,
            title: "Terraform Drift (aws/bar/prod)",
            state: "OPEN",
          },
        ],
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
        },
      },
    });

    const targets = new Map([
      ["aws/foo/dev", "ubuntu-latest"],
      ["aws/bar/prod", "ubuntu-latest"],
    ]);

    const input: RunInput = {
      driftDetection: {
        minimum_detection_interval: 24,
        num_of_issues: 10,
      },
      octokit: octokit as unknown as RunInput["octokit"],
      targets,
      repoOwner: "owner",
      repoName: "repo",
      now: new Date("2024-01-15T10:00:00Z"),
      serverUrl: "https://github.com",
      logger,
    };

    const result = await run(input);

    expect(octokit.graphql).toHaveBeenCalledTimes(2);
    expect(result.issues).toHaveLength(2);
  });
});
