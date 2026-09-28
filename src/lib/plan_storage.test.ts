import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import type * as github from "@actions/github";
import { downloadPreviousPlanMeta } from "./plan_storage";

const downloadArtifact = vi.fn();

vi.mock("@actions/artifact", () => ({
  DefaultArtifactClient: class MockArtifactClient {
    downloadArtifact = downloadArtifact;
  },
}));

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof fs>("fs");
  return {
    ...actual,
    readFileSync: vi.fn(),
  };
});

const artifact = (
  id: number,
  runId: number,
  createdAt: string,
  overrides: Record<string, unknown> = {},
) => ({
  id,
  expired: false,
  created_at: createdAt,
  workflow_run: {
    id: runId,
    head_branch: "feature",
    head_repository_id: 1,
  },
  ...overrides,
});

const newOctokit = (artifacts: unknown[]) =>
  ({
    rest: {
      actions: {
        listArtifactsForRepo: vi.fn().mockResolvedValue({
          data: { artifacts },
        }),
      },
    },
  }) as unknown as ReturnType<typeof github.getOctokit>;

const params = (octokit: ReturnType<typeof github.getOctokit>) => ({
  octokit,
  token: "token",
  owner: "owner",
  repo: "repo",
  target: "aws/foo",
  headRef: "feature",
  headRepoId: 1,
  currentRunId: 100,
  dest: "/tmp/dest",
});

describe("downloadPreviousPlanMeta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        storage: "github-artifacts",
        summary: "create",
        plan_hash: "v1:sha256:abc",
      }),
    );
  });

  it("downloads the latest artifact of a previous run on the head branch", async () => {
    const octokit = newOctokit([
      artifact(1, 90, "2026-09-01T00:00:00Z"),
      artifact(2, 100, "2026-09-03T00:00:00Z"), // current run
      artifact(3, 95, "2026-09-02T00:00:00Z"),
      artifact(4, 96, "2026-09-02T12:00:00Z", { expired: true }),
      artifact(5, 97, "2026-09-02T13:00:00Z", {
        workflow_run: { id: 97, head_branch: "other", head_repository_id: 1 },
      }),
      artifact(6, 98, "2026-09-02T14:00:00Z", {
        workflow_run: { id: 98, head_branch: "feature", head_repository_id: 2 },
      }),
    ]);
    const meta = await downloadPreviousPlanMeta(params(octokit));

    expect(meta?.plan_hash).toBe("v1:sha256:abc");
    expect(octokit.rest.actions.listArtifactsForRepo).toHaveBeenCalledWith(
      expect.objectContaining({ name: "terraform_plan_meta_aws__foo" }),
    );
    expect(downloadArtifact).toHaveBeenCalledWith(
      3,
      expect.objectContaining({
        path: "/tmp/dest",
        findBy: expect.objectContaining({ workflowRunId: 95 }),
      }),
    );
  });

  it("returns undefined if no previous run is found", async () => {
    const octokit = newOctokit([artifact(2, 100, "2026-09-03T00:00:00Z")]);
    expect(await downloadPreviousPlanMeta(params(octokit))).toBeUndefined();
    expect(downloadArtifact).not.toHaveBeenCalled();
  });
});
