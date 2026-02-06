import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Config } from "./types";

vi.mock("@actions/github", () => ({
  getOctokit: vi.fn(),
  context: {
    repo: {
      owner: "default-owner",
      repo: "default-repo",
    },
  },
}));

import * as github from "@actions/github";
import { createIssue, getDriftIssueRepo } from "./drift";

const createMockConfig = (driftDetection?: Config["drift_detection"]): Config =>
  ({
    drift_detection: driftDetection,
    working_directory_file: "tfaction.yaml",
    git_root_dir: "/workspace",
    target_groups: [{ working_directory: "aws" }],
    config_path: "/workspace/tfaction-root.yaml",
    config_dir: "/workspace",
    workspace: "/workspace",
  }) as Config;

describe("createIssue", () => {
  const mockCreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({
      data: {
        html_url: "https://github.com/owner/repo/issues/42",
        number: 42,
        title: "Terraform Drift (aws/foo/dev)",
        state: "open",
      },
    });
    vi.mocked(github.getOctokit).mockReturnValue({
      rest: {
        issues: {
          create: mockCreate,
        },
      },
    } as unknown as ReturnType<typeof github.getOctokit>);
  });

  it("creates issue with correct parameters", async () => {
    await createIssue("aws/foo/dev", "gh-token", "my-owner", "my-repo");
    expect(mockCreate).toHaveBeenCalledWith({
      owner: "my-owner",
      repo: "my-repo",
      title: "Terraform Drift (aws/foo/dev)",
      body: expect.stringContaining("tfaction"),
    });
  });

  it("returns mapped Issue object", async () => {
    const result = await createIssue(
      "aws/foo/dev",
      "gh-token",
      "my-owner",
      "my-repo",
    );
    expect(result).toEqual({
      url: "https://github.com/owner/repo/issues/42",
      number: 42,
      title: "Terraform Drift (aws/foo/dev)",
      state: "open",
      target: "aws/foo/dev",
    });
  });

  it("passes ghToken to getOctokit", async () => {
    await createIssue("aws/foo/dev", "my-secret-token", "owner", "repo");
    expect(github.getOctokit).toHaveBeenCalledWith("my-secret-token");
  });

  it("uses target in title", async () => {
    await createIssue("gcp/bar/prod", "gh-token", "owner", "repo");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Terraform Drift (gcp/bar/prod)",
      }),
    );
  });
});

describe("getDriftIssueRepo", () => {
  it("returns config values when both are set", () => {
    const cfg = createMockConfig({
      issue_repo_owner: "custom-owner",
      issue_repo_name: "custom-repo",
      minimum_detection_interval: 168,
    });
    const result = getDriftIssueRepo(cfg);
    expect(result).toEqual({
      owner: "custom-owner",
      name: "custom-repo",
    });
  });

  it("falls back to github.context.repo when drift_detection is undefined", () => {
    const cfg = createMockConfig(undefined);
    const result = getDriftIssueRepo(cfg);
    expect(result).toEqual({
      owner: "default-owner",
      name: "default-repo",
    });
  });

  it("falls back to github.context.repo when fields are not set", () => {
    const cfg = createMockConfig({
      minimum_detection_interval: 168,
    });
    const result = getDriftIssueRepo(cfg);
    expect(result).toEqual({
      owner: "default-owner",
      name: "default-repo",
    });
  });

  it("uses config owner with fallback repo name", () => {
    const cfg = createMockConfig({
      issue_repo_owner: "custom-owner",
      minimum_detection_interval: 168,
    });
    const result = getDriftIssueRepo(cfg);
    expect(result).toEqual({
      owner: "custom-owner",
      name: "default-repo",
    });
  });

  it("uses config repo name with fallback owner", () => {
    const cfg = createMockConfig({
      issue_repo_name: "custom-repo",
      minimum_detection_interval: 168,
    });
    const result = getDriftIssueRepo(cfg);
    expect(result).toEqual({
      owner: "default-owner",
      name: "custom-repo",
    });
  });
});
