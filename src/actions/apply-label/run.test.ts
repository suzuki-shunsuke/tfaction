import { describe, it, expect, vi, beforeEach } from "vitest";
import * as github from "@actions/github";
import { main, type RunInputs } from "./run";

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

describe("main", () => {
  const mockRemoveLabel = vi.fn();
  const mockAddLabels = vi.fn();
  const mockListLabelsOnIssue = vi.fn();

  const baseInputs: RunInputs = {
    githubToken: "test-token",
    prNumber: 42,
    result: "success",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRemoveLabel.mockResolvedValue({});
    mockAddLabels.mockResolvedValue({});
    mockListLabelsOnIssue.mockResolvedValue({ data: [] });
    vi.mocked(github.getOctokit).mockReturnValue({
      rest: {
        issues: {
          removeLabel: mockRemoveLabel,
          addLabels: mockAddLabels,
          listLabelsOnIssue: mockListLabelsOnIssue,
        },
      },
    } as unknown as ReturnType<typeof github.getOctokit>);
  });

  it("does nothing when result is skipped", async () => {
    await main({ ...baseInputs, result: "skipped" });

    expect(github.getOctokit).not.toHaveBeenCalled();
    expect(mockListLabelsOnIssue).not.toHaveBeenCalled();
  });

  it("does nothing when result is success and no fail label exists", async () => {
    mockListLabelsOnIssue.mockResolvedValue({
      data: [{ name: "unrelated-label" }],
    });

    await main({ ...baseInputs, result: "success" });

    expect(mockRemoveLabel).not.toHaveBeenCalled();
    expect(mockAddLabels).not.toHaveBeenCalled();
  });

  it("removes fail label when result is success and fail label exists", async () => {
    mockListLabelsOnIssue.mockResolvedValue({
      data: [
        { name: "tfaction:apply-result:fail" },
        { name: "unrelated-label" },
      ],
    });

    await main({ ...baseInputs, result: "success" });

    expect(mockRemoveLabel).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      issue_number: 42,
      name: "tfaction:apply-result:fail",
    });
    expect(mockAddLabels).not.toHaveBeenCalled();
  });

  it("adds fail label when result is failure and no fail label exists", async () => {
    mockListLabelsOnIssue.mockResolvedValue({
      data: [{ name: "unrelated-label" }],
    });

    await main({ ...baseInputs, result: "failure" });

    expect(mockAddLabels).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      issue_number: 42,
      labels: ["tfaction:apply-result:fail"],
    });
    expect(mockRemoveLabel).not.toHaveBeenCalled();
  });

  it("does nothing when result is failure and fail label already exists", async () => {
    mockListLabelsOnIssue.mockResolvedValue({
      data: [{ name: "tfaction:apply-result:fail" }],
    });

    await main({ ...baseInputs, result: "failure" });

    expect(mockAddLabels).not.toHaveBeenCalled();
    expect(mockRemoveLabel).not.toHaveBeenCalled();
  });

  it("adds fail label when result is cancelled", async () => {
    mockListLabelsOnIssue.mockResolvedValue({
      data: [],
    });

    await main({ ...baseInputs, result: "cancelled" });

    expect(mockAddLabels).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      issue_number: 42,
      labels: ["tfaction:apply-result:fail"],
    });
  });
});
