import { buildModuleToCallers, inspectWithTofu, parseShowModule } from "./";
import { expect, describe, it, vi, beforeEach } from "vitest";
import { post } from "../../../../comment";

vi.mock("../../../../comment", () => ({
  post: vi.fn(),
}));

describe("buildModuleToCallers", () => {
  // Input (moduleCalls):
  //   key: relative path from git_root_dir to module caller (working directory)
  //   value: relative paths from git_root_dir to modules (modules being called)
  // Output (ModuleToCallers):
  //   key: relative path from git_root_dir to module
  //   value: relative paths from git_root_dir to module callers

  it("creates a map from callee to its direct callers and transitive callers", () => {
    const actual = buildModuleToCallers({
      // These are working directories or modules that call other modules
      // All paths are relative from git_root_dir (already normalized)
      "modules/a": ["modules/b/v2", "modules/c", "d"],
      "modules/c": ["modules/e"],
      "modules/e": ["modules/f"],
      d: ["modules/g"],
      "modules/x": ["modules/b/v2", "modules/e"],
    });
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

describe("parseShowModule", () => {
  it("returns module_calls", () => {
    expect(
      parseShowModule(
        '{"format_version":"1.0","root_module":{"module_calls":{"vpc":{"source":"../modules/vpc"}}}}',
      ),
    ).toEqual({ vpc: { source: "../modules/vpc" } });
  });
  it("returns an empty object if module_calls is omitted", () => {
    expect(parseShowModule('{"root_module":{}}')).toEqual({});
  });
});

describe("inspectWithTofu", () => {
  beforeEach(() => {
    vi.mocked(post).mockReset();
  });

  /** A mock executor. getExecOutput returns or throws out */
  const newExecutor = (
    out: { exitCode: number; stdout?: string; stderr?: string } | Error,
  ) => {
    const getExecOutput = vi.fn();
    if (out instanceof Error) {
      getExecOutput.mockRejectedValueOnce(out);
    } else {
      getExecOutput.mockResolvedValueOnce({ stdout: "", stderr: "", ...out });
    }
    return { exec: vi.fn().mockResolvedValue(0), getExecOutput };
  };

  const newInput = (
    executor: ReturnType<typeof newExecutor>,
    prNumber = 1,
  ) => ({
    executor: executor as unknown as Parameters<
      typeof inspectWithTofu
    >[0]["executor"],
    tfDir: "aws/foo",
    absTfDir: "/repo/aws/foo",
    githubToken: "token",
    terraformCommand: "tofu",
    octokit: {} as Parameters<typeof inspectWithTofu>[0]["octokit"],
    prNumber,
  });

  const notFound = () => new Error("Unable to locate executable file: tofu.");

  it("returns module calls", async () => {
    const executor = newExecutor({
      exitCode: 0,
      stdout:
        '{"root_module":{"module_calls":{"vpc":{"source":"../modules/vpc"}}}}',
    });
    const result = await inspectWithTofu(newInput(executor));
    expect(result).toEqual({
      moduleCalls: { vpc: { source: "../modules/vpc" } },
    });
    expect(executor.exec).toHaveBeenCalledWith(
      "aqua",
      ["i", "-l", "-a"],
      expect.objectContaining({ cwd: "/repo/aws/foo" }),
    );
    expect(executor.getExecOutput).toHaveBeenCalledWith(
      "tofu",
      ["show", "-module=.", "-json"],
      expect.objectContaining({ cwd: "/repo/aws/foo", ignoreReturnCode: true }),
    );
  });

  it("runs terraform_command as is", async () => {
    const executor = newExecutor({ exitCode: 0, stdout: '{"root_module":{}}' });
    const result = await inspectWithTofu({
      ...newInput(executor),
      terraformCommand: "/opt/tofu/bin/tofu",
    });
    expect(result).toEqual({ moduleCalls: {} });
    expect(executor.getExecOutput).toHaveBeenCalledWith(
      "/opt/tofu/bin/tofu",
      ["show", "-module=.", "-json"],
      expect.anything(),
    );
  });

  it("falls back if tofu doesn't support -module", async () => {
    const executor = newExecutor({
      exitCode: 1,
      stderr: "flag provided but not defined: -module\nUsage: tofu show",
    });
    const result = await inspectWithTofu(newInput(executor));
    expect(result.moduleCalls).toBeUndefined();
    expect(result.reason).toContain("doesn't support -module");
  });

  it("falls back if a value of static evaluation can't be computed", async () => {
    const executor = newExecutor({
      exitCode: 1,
      stderr:
        "Error: Failed to request input from user for variable var.env\nError: Unable to compute static value\nError: Duplicate module call\n",
    });
    const result = await inspectWithTofu(newInput(executor));
    expect(result.moduleCalls).toBeUndefined();
    expect(result.reason).toContain("Unable to compute static value");
  });

  it("throws if tofu show -module fails for another reason", async () => {
    const executor = newExecutor({
      exitCode: 1,
      stderr: "Error: Unsupported block type\n",
    });
    await expect(inspectWithTofu(newInput(executor))).rejects.toThrow(
      "failed in aws/foo",
    );
    expect(post).not.toHaveBeenCalled();
  });

  it("posts a comment and throws if tofu isn't found", async () => {
    const executor = newExecutor(notFound());
    await expect(inspectWithTofu(newInput(executor))).rejects.toThrow(
      "isn't found",
    );
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({
        prNumber: 1,
        templateKey: "tofu-not-found",
        vars: { tfaction_target: "aws/foo", command: "tofu" },
      }),
    );
  });

  it("doesn't post a comment if there is no pull request", async () => {
    const executor = newExecutor(notFound());
    await expect(inspectWithTofu(newInput(executor, 0))).rejects.toThrow(
      "isn't found",
    );
    expect(post).not.toHaveBeenCalled();
  });

  it("rethrows an error other than a missing command", async () => {
    const executor = newExecutor(new Error("failed to post a comment"));
    await expect(inspectWithTofu(newInput(executor))).rejects.toThrow(
      "failed to post a comment",
    );
    expect(post).not.toHaveBeenCalled();
  });

  it("throws if aqua i fails", async () => {
    const executor = newExecutor({ exitCode: 0 });
    executor.exec.mockRejectedValueOnce(new Error("aqua i failed"));
    await expect(inspectWithTofu(newInput(executor))).rejects.toThrow(
      "aqua i failed",
    );
    expect(executor.getExecOutput).not.toHaveBeenCalled();
  });
});
