import { resolveRelativeCallTree, buildModuleToCallers } from "./";
import { expect, describe, it } from "vitest";

describe("resolveRelativeCallTree", () => {
  it("resolves relative paths in terraform-config-inspect", () => {
    const actual = resolveRelativeCallTree({
      "modules/a": ["../b/v2", "../c", "../../d"],
      "modules/c": ["../e"],
      d: ["../modules/g"],
    });
    expect(actual).toEqual({
      // caller : [caller, ...]
      "modules/a": ["modules/b/v2", "modules/c", "d"],
      "modules/c": ["modules/e"],
      d: ["modules/g"],
    });
  });

  it("handles empty input", () => {
    const actual = resolveRelativeCallTree({});
    expect(actual).toEqual({});
  });

  it("handles single module with no children", () => {
    const actual = resolveRelativeCallTree({
      "modules/a": [],
    });
    expect(actual).toEqual({
      "modules/a": [],
    });
  });

  it("handles current directory reference", () => {
    const actual = resolveRelativeCallTree({
      "modules/a": ["./submodule", "./nested/deep"],
    });
    expect(actual).toEqual({
      "modules/a": ["modules/a/submodule", "modules/a/nested/deep"],
    });
  });

  it("handles deeply nested paths", () => {
    const actual = resolveRelativeCallTree({
      "a/b/c/d/e": ["../../../shared", "../../../../common"],
    });
    expect(actual).toEqual({
      "a/b/c/d/e": ["a/b/shared", "a/common"],
    });
  });

  it("handles root level modules", () => {
    const actual = resolveRelativeCallTree({
      terraform: ["../modules/vpc", "../modules/iam"],
    });
    expect(actual).toEqual({
      terraform: ["modules/vpc", "modules/iam"],
    });
  });

  it("handles multiple modules calling same target", () => {
    const actual = resolveRelativeCallTree({
      "app/dev": ["../../modules/shared"],
      "app/prod": ["../../modules/shared"],
      "web/dev": ["../../modules/shared"],
    });
    expect(actual).toEqual({
      "app/dev": ["modules/shared"],
      "app/prod": ["modules/shared"],
      "web/dev": ["modules/shared"],
    });
  });
});

describe("buildModuleToCallers", () => {
  it("creates a map from callee to its direct callers and transitive callers", () => {
    const actual = buildModuleToCallers(
      resolveRelativeCallTree({
        "modules/a": ["../b/v2", "../c", "../../d"],
        "modules/c": ["../e"],
        "modules/e": ["../f"],
        d: ["../modules/g"],
        "modules/x": ["../b/v2", "../e"],
      }),
    );
    expect(actual).toEqual({
      // callee : [caller, ...caller]
      "modules/b/v2": ["modules/a", "modules/x"],
      "modules/c": ["modules/a"],
      d: ["modules/a"],
      "modules/e": [
        "modules/c",
        "modules/a", // e -> c -> a
        "modules/x", // x -> e
      ],
      "modules/f": [
        "modules/e",
        "modules/c",
        "modules/a", // f -> e -> c -> a
        "modules/x", // f -> e -> x
      ],
      "modules/g": [
        "d",
        "modules/a", // g -> d -> a
      ],
    });
  });

  it("handles empty input", () => {
    const actual = buildModuleToCallers({});
    expect(actual).toEqual({});
  });

  it("handles single direct caller", () => {
    const actual = buildModuleToCallers({
      "terraform/dev": ["modules/vpc"],
    });
    expect(actual).toEqual({
      "modules/vpc": ["terraform/dev"],
    });
  });

  it("handles multiple direct callers for same module", () => {
    const actual = buildModuleToCallers({
      "terraform/dev": ["modules/vpc"],
      "terraform/prod": ["modules/vpc"],
      "terraform/staging": ["modules/vpc"],
    });
    expect(actual).toEqual({
      "modules/vpc": ["terraform/dev", "terraform/prod", "terraform/staging"],
    });
  });

  it("handles caller with no modules", () => {
    const actual = buildModuleToCallers({
      "terraform/dev": [],
    });
    expect(actual).toEqual({});
  });

  it("handles chain of module calls", () => {
    // a -> b -> c -> d
    const actual = buildModuleToCallers({
      a: ["b"],
      b: ["c"],
      c: ["d"],
    });
    expect(actual).toEqual({
      b: ["a"],
      c: ["b", "a"],
      d: ["c", "b", "a"],
    });
  });

  it("handles diamond dependency pattern", () => {
    // a -> b, a -> c, b -> d, c -> d
    // Note: duplicates are included when multiple paths lead to the same caller
    const actual = buildModuleToCallers({
      a: ["b", "c"],
      b: ["d"],
      c: ["d"],
    });
    expect(actual).toEqual({
      b: ["a"],
      c: ["a"],
      d: ["b", "a", "c", "a"], // a appears twice: via b and via c
    });
  });

  it("handles module calling multiple other modules", () => {
    const actual = buildModuleToCallers({
      "terraform/app": ["modules/vpc", "modules/iam", "modules/rds"],
    });
    expect(actual).toEqual({
      "modules/vpc": ["terraform/app"],
      "modules/iam": ["terraform/app"],
      "modules/rds": ["terraform/app"],
    });
  });

  it("handles complex multi-level transitive dependencies", () => {
    // app calls shared, shared calls base, infra calls base
    const actual = buildModuleToCallers({
      "terraform/app": ["modules/shared"],
      "modules/shared": ["modules/base"],
      "terraform/infra": ["modules/base"],
    });
    expect(actual).toEqual({
      "modules/shared": ["terraform/app"],
      "modules/base": [
        "modules/shared",
        "terraform/app", // base <- shared <- app
        "terraform/infra",
      ],
    });
  });

  it("handles modules with overlapping paths", () => {
    const actual = buildModuleToCallers({
      "terraform/aws/dev": ["modules/vpc"],
      "terraform/aws/prod": ["modules/vpc"],
      "terraform/gcp/dev": ["modules/network"],
    });
    expect(actual).toEqual({
      "modules/vpc": ["terraform/aws/dev", "terraform/aws/prod"],
      "modules/network": ["terraform/gcp/dev"],
    });
  });
});
