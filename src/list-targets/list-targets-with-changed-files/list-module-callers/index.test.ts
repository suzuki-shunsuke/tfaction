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
  // Input (moduleCalls):
  //   key: relative path from github.workspace to module caller (working directory)
  //   value: absolute paths to modules (modules being called)
  // Output (ModuleToCallers):
  //   key: absolute path to module
  //   value: relative paths from github.workspace to module callers

  it("creates a map from callee to its direct callers and transitive callers", () => {
    const actual = buildModuleToCallers(
      resolveRelativeCallTree({
        // These are working directories or modules that call other modules
        "modules/a": ["../b/v2", "../c", "../../d"],
        "modules/c": ["../e"],
        "modules/e": ["../f"],
        d: ["../modules/g"],
        "modules/x": ["../b/v2", "../e"],
      }),
    );
    expect(actual).toEqual({
      // module : [callers...]
      "modules/b/v2": ["modules/a", "modules/x"],
      "modules/c": ["modules/a"],
      d: ["modules/a"],
      "modules/e": [
        "modules/c",
        "modules/a", // e <- c <- a
        "modules/x", // e <- x
      ],
      "modules/f": [
        "modules/e",
        "modules/c",
        "modules/a", // f <- e <- c <- a
        "modules/x", // f <- e <- x
      ],
      "modules/g": [
        "d",
        "modules/a", // g <- d <- a
      ],
    });
  });

  it("handles empty input", () => {
    const actual = buildModuleToCallers({});
    expect(actual).toEqual({});
  });

  it("handles single working directory calling a module", () => {
    // terraform/dev (working directory) calls modules/vpc (module)
    const actual = buildModuleToCallers({
      "terraform/dev": ["modules/vpc"],
    });
    expect(actual).toEqual({
      // modules/vpc is called by terraform/dev
      "modules/vpc": ["terraform/dev"],
    });
  });

  it("handles multiple working directories calling same module", () => {
    // Multiple working directories call the same module
    const actual = buildModuleToCallers({
      "terraform/dev": ["modules/vpc"],
      "terraform/prod": ["modules/vpc"],
      "terraform/staging": ["modules/vpc"],
    });
    expect(actual).toEqual({
      "modules/vpc": ["terraform/dev", "terraform/prod", "terraform/staging"],
    });
  });

  it("handles working directory with no module calls", () => {
    const actual = buildModuleToCallers({
      "terraform/dev": [],
    });
    expect(actual).toEqual({});
  });

  it("handles chain of module calls (module calling another module)", () => {
    // modules/app calls modules/shared, modules/shared calls modules/base
    // terraform/infra (working directory) calls modules/app
    const actual = buildModuleToCallers({
      "terraform/infra": ["modules/app"],
      "modules/app": ["modules/shared"],
      "modules/shared": ["modules/base"],
    });
    expect(actual).toEqual({
      "modules/app": ["terraform/infra"],
      "modules/shared": ["modules/app", "terraform/infra"],
      "modules/base": ["modules/shared", "modules/app", "terraform/infra"],
    });
  });

  it("handles diamond dependency pattern", () => {
    // terraform/app calls both modules/vpc and modules/iam
    // Both modules/vpc and modules/iam call modules/base
    // Note: duplicates are included when multiple paths lead to the same caller
    const actual = buildModuleToCallers({
      "terraform/app": ["modules/vpc", "modules/iam"],
      "modules/vpc": ["modules/base"],
      "modules/iam": ["modules/base"],
    });
    expect(actual).toEqual({
      "modules/vpc": ["terraform/app"],
      "modules/iam": ["terraform/app"],
      // modules/base is called by both vpc and iam, both of which are called by terraform/app
      "modules/base": [
        "modules/vpc",
        "terraform/app",
        "modules/iam",
        "terraform/app", // appears twice: via vpc and via iam
      ],
    });
  });

  it("handles working directory calling multiple modules", () => {
    // terraform/app (working directory) calls three modules
    const actual = buildModuleToCallers({
      "terraform/app": ["modules/vpc", "modules/iam", "modules/rds"],
    });
    expect(actual).toEqual({
      "modules/vpc": ["terraform/app"],
      "modules/iam": ["terraform/app"],
      "modules/rds": ["terraform/app"],
    });
  });

  it("handles module calling another module with working directory caller", () => {
    // terraform/app (working directory) calls modules/shared
    // modules/shared calls modules/base
    // terraform/infra (working directory) also calls modules/base directly
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

  it("handles multiple working directories with different modules", () => {
    // Different working directories call different modules
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
