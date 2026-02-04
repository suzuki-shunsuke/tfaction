import { describe, it, expect, vi } from "vitest";
import { buildBody, run, type RunInput } from "./run";

describe("buildBody", () => {
  it("builds correct body with comment details", () => {
    const result = buildBody({
      created_at: "2024-01-15T10:00:00Z",
      html_url: "https://github.com/owner/repo/issues/1#issuecomment-123456789",
      body: "Drift detected in `aws/foo/dev`.",
    });

    expect(result).toContain("[2024-01-15T10:00:00Z]");
    expect(result).toContain(
      "(https://github.com/owner/repo/issues/1#issuecomment-123456789)",
    );
    expect(result).toContain("Drift detected in `aws/foo/dev`.");
  });

  it("includes tfaction documentation links", () => {
    const result = buildBody({
      created_at: "2024-01-15T10:00:00Z",
      html_url: "https://github.com/owner/repo/issues/1#issuecomment-1",
      body: "comment body",
    });

    expect(result).toContain(
      "https://suzuki-shunsuke.github.io/tfaction/docs/",
    );
    expect(result).toContain(
      "https://suzuki-shunsuke.github.io/tfaction/docs/feature/drift-detection",
    );
  });

  it("formats the body with the expected structure", () => {
    const result = buildBody({
      created_at: "2024-02-01T08:30:00Z",
      html_url: "https://github.com/o/r/issues/5#issuecomment-99",
      body: "some drift info",
    });

    expect(result).toBe(
      `This issue was created by [tfaction](https://suzuki-shunsuke.github.io/tfaction/docs/).

About this issue, please see [the document](https://suzuki-shunsuke.github.io/tfaction/docs/feature/drift-detection).

## Latest comment

[2024-02-01T08:30:00Z](https://github.com/o/r/issues/5#issuecomment-99)

some drift info
`,
    );
  });
});

describe("run", () => {
  it("calls octokit.rest.issues.update with correct parameters", async () => {
    const mockUpdate = vi.fn().mockResolvedValue({});
    const input: RunInput = {
      issueNumber: 42,
      comment: {
        created_at: "2024-01-15T10:00:00Z",
        html_url: "https://github.com/owner/repo/issues/42#issuecomment-1",
        body: "drift info",
      },
      owner: "owner",
      repo: "repo",
      octokit: {
        rest: {
          issues: {
            update: mockUpdate,
          },
        },
      },
    };

    await run(input);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 42,
      body: buildBody(input.comment),
    });
  });
});
