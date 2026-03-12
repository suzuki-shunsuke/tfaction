import { describe, expect, test, vi } from "vitest";
import { generateLabels, addTargetLabels } from "./target-labels";

describe("generateLabels", () => {
  test("no rules returns empty map", () => {
    const result = generateLabels(["foo/stg/bar"], []);
    expect(result.size).toBe(0);
  });

  test("simple label match without backreference", () => {
    const result = generateLabels(
      ["foo/stg/bar"],
      [{ regexp: ".*/stg/.*", label: "staging" }],
    );
    expect(result).toEqual(new Map([["staging", undefined]]));
  });

  test("backreference $1 replacement", () => {
    const result = generateLabels(
      ["infra/stg"],
      [{ regexp: "(.*)/stg", label: "$1" }],
    );
    expect(result).toEqual(new Map([["infra", undefined]]));
  });

  test("non-matching target produces no label", () => {
    const result = generateLabels(
      ["foo/prod/bar"],
      [{ regexp: ".*/stg/.*", label: "staging" }],
    );
    expect(result.size).toBe(0);
  });

  test("multiple targets and multiple rules", () => {
    const result = generateLabels(
      ["foo/stg/bar", "baz/prod/qux"],
      [
        { regexp: ".*/stg/.*", label: "staging" },
        { regexp: ".*/prod/.*", label: "production" },
      ],
    );
    expect(result).toEqual(
      new Map([
        ["staging", undefined],
        ["production", undefined],
      ]),
    );
  });

  test("color propagation", () => {
    const result = generateLabels(
      ["foo/stg/bar"],
      [{ regexp: ".*/stg/.*", label: "staging", color: "ffff00" }],
    );
    expect(result).toEqual(new Map([["staging", "ffff00"]]));
  });

  test("color from later rule overrides undefined", () => {
    const result = generateLabels(
      ["foo/stg/bar"],
      [
        { regexp: ".*/stg/.*", label: "staging" },
        { regexp: "foo/.*", label: "staging", color: "00ff00" },
      ],
    );
    expect(result).toEqual(new Map([["staging", "00ff00"]]));
  });
});

describe("addTargetLabels", () => {
  const createMockOctokit = (
    addedLabels: Array<{ name: string; color: string }>,
  ) => {
    return {
      rest: {
        issues: {
          addLabels: vi.fn().mockResolvedValue({ data: addedLabels }),
          updateLabel: vi.fn().mockResolvedValue({}),
        },
      },
    } as unknown as ReturnType<typeof import("@actions/github").getOctokit>;
  };

  test("calls addLabels with generated labels", async () => {
    const octokit = createMockOctokit([{ name: "staging", color: "ededed" }]);
    await addTargetLabels(
      octokit,
      "owner",
      "repo",
      1,
      ["foo/stg/bar"],
      [{ regexp: ".*/stg/.*", label: "staging" }],
    );
    expect(octokit.rest.issues.addLabels).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 1,
      labels: ["staging"],
    });
  });

  test("calls updateLabel when color differs", async () => {
    const octokit = createMockOctokit([{ name: "staging", color: "ededed" }]);
    await addTargetLabels(
      octokit,
      "owner",
      "repo",
      1,
      ["foo/stg/bar"],
      [{ regexp: ".*/stg/.*", label: "staging", color: "ffff00" }],
    );
    expect(octokit.rest.issues.updateLabel).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      name: "staging",
      color: "ffff00",
    });
  });

  test("does not call updateLabel when color matches", async () => {
    const octokit = createMockOctokit([{ name: "staging", color: "ffff00" }]);
    await addTargetLabels(
      octokit,
      "owner",
      "repo",
      1,
      ["foo/stg/bar"],
      [{ regexp: ".*/stg/.*", label: "staging", color: "ffff00" }],
    );
    expect(octokit.rest.issues.updateLabel).not.toHaveBeenCalled();
  });

  test("does nothing when no labels generated", async () => {
    const octokit = createMockOctokit([]);
    await addTargetLabels(
      octokit,
      "owner",
      "repo",
      1,
      ["foo/prod/bar"],
      [{ regexp: ".*/stg/.*", label: "staging" }],
    );
    expect(octokit.rest.issues.addLabels).not.toHaveBeenCalled();
  });

  test("does not call updateLabel when no color defined", async () => {
    const octokit = createMockOctokit([{ name: "staging", color: "ededed" }]);
    await addTargetLabels(
      octokit,
      "owner",
      "repo",
      1,
      ["foo/stg/bar"],
      [{ regexp: ".*/stg/.*", label: "staging" }],
    );
    expect(octokit.rest.issues.updateLabel).not.toHaveBeenCalled();
  });
});
