import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as core from "@actions/core";
import * as github from "@actions/github";
import { aggregateResultSummaries, main, type RunInputs } from "./run";

vi.mock("@actions/core", () => ({
  setOutput: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
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

const mockDownloadArtifact = vi.fn();
const mockListArtifacts = vi.fn();

vi.mock("@actions/artifact", () => ({
  DefaultArtifactClient: class {
    listArtifacts = mockListArtifacts;
    downloadArtifact = mockDownloadArtifact;
  },
}));

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof fs>("fs");
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    mkdtempSync: vi.fn().mockReturnValue("/tmp/tfaction-plan-mock"),
  };
});

describe("aggregateResultSummaries", () => {
  it("returns no-op for empty array", () => {
    expect(aggregateResultSummaries([])).toBe("no-op");
  });

  it("returns no-op when all are no-op", () => {
    expect(aggregateResultSummaries(["no-op", "no-op"])).toBe("no-op");
  });

  it("returns create when create is highest", () => {
    expect(aggregateResultSummaries(["no-op", "create"])).toBe("create");
  });

  it("returns update when update is highest", () => {
    expect(aggregateResultSummaries(["no-op", "create", "update"])).toBe(
      "update",
    );
  });

  it("returns delete when delete is present", () => {
    expect(
      aggregateResultSummaries(["no-op", "create", "update", "delete"]),
    ).toBe("delete");
  });

  it("returns delete even if it appears first", () => {
    expect(aggregateResultSummaries(["delete", "no-op"])).toBe("delete");
  });
});

describe("main", () => {
  const mockRemoveLabel = vi.fn();
  const mockAddLabels = vi.fn();

  const inputs: RunInputs = {
    githubToken: "test-token",
    prNumber: 42,
    workflowRunId: 12345,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRemoveLabel.mockResolvedValue({});
    mockAddLabels.mockResolvedValue({});
    vi.mocked(github.getOctokit).mockReturnValue({
      rest: {
        issues: {
          removeLabel: mockRemoveLabel,
          addLabels: mockAddLabels,
        },
      },
    } as unknown as ReturnType<typeof github.getOctokit>);
  });

  it("sets no-op when no artifacts found", async () => {
    mockListArtifacts.mockResolvedValue({ artifacts: [] });

    await main(inputs);

    expect(core.setOutput).toHaveBeenCalledWith("result_summary", "no-op");
    expect(mockAddLabels).not.toHaveBeenCalled();
  });

  it("aggregates plan results and adds label", async () => {
    mockListArtifacts.mockResolvedValue({
      artifacts: [
        { id: 1, name: "terraform_plan_json_target1" },
        { id: 2, name: "terraform_plan_json_target2" },
      ],
    });
    mockDownloadArtifact.mockResolvedValue({});
    vi.mocked(fs.existsSync).mockReturnValue(true);

    // First plan: no changes, second plan: has create
    vi.mocked(fs.readFileSync)
      .mockReturnValueOnce(JSON.stringify({ resource_changes: [] }))
      .mockReturnValueOnce(
        JSON.stringify({
          resource_changes: [{ change: { actions: ["create"] } }],
        }),
      );

    await main(inputs);

    expect(core.setOutput).toHaveBeenCalledWith("result_summary", "create");
    expect(mockAddLabels).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      issue_number: 42,
      labels: ["tfaction:plan-result:create"],
    });
  });

  it("removes other plan-result labels", async () => {
    mockListArtifacts.mockResolvedValue({
      artifacts: [{ id: 1, name: "terraform_plan_json_target1" }],
    });
    mockDownloadArtifact.mockResolvedValue({});
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        resource_changes: [{ change: { actions: ["delete"] } }],
      }),
    );

    await main(inputs);

    // Should try to remove no-op, create, and update labels (not delete)
    expect(mockRemoveLabel).toHaveBeenCalledTimes(3);
    expect(mockRemoveLabel).toHaveBeenCalledWith(
      expect.objectContaining({ name: "tfaction:plan-result:no-op" }),
    );
    expect(mockRemoveLabel).toHaveBeenCalledWith(
      expect.objectContaining({ name: "tfaction:plan-result:create" }),
    );
    expect(mockRemoveLabel).toHaveBeenCalledWith(
      expect.objectContaining({ name: "tfaction:plan-result:update" }),
    );
    expect(mockAddLabels).toHaveBeenCalledWith(
      expect.objectContaining({
        labels: ["tfaction:plan-result:delete"],
      }),
    );
  });

  it("skips artifacts without plan JSON file", async () => {
    mockListArtifacts.mockResolvedValue({
      artifacts: [{ id: 1, name: "terraform_plan_json_target1" }],
    });
    mockDownloadArtifact.mockResolvedValue({});
    vi.mocked(fs.existsSync).mockReturnValue(false);

    await main(inputs);

    expect(core.warning).toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("result_summary", "no-op");
  });

  it("filters out non-plan artifacts", async () => {
    mockListArtifacts.mockResolvedValue({
      artifacts: [
        { id: 1, name: "terraform_plan_json_target1" },
        { id: 2, name: "terraform_plan_file_target1" },
        { id: 3, name: "other_artifact" },
      ],
    });
    mockDownloadArtifact.mockResolvedValue({});
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ resource_changes: [] }),
    );

    await main(inputs);

    // Only 1 artifact should be downloaded (the plan JSON one)
    expect(mockDownloadArtifact).toHaveBeenCalledTimes(1);
  });
});
