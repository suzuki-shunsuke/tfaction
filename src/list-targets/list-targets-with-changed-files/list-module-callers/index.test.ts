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
});

describe("buildCallerToCallers", () => {
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
});
