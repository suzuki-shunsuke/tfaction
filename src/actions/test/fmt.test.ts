import { describe, it, expect, vi, beforeEach } from "vitest";
import { fmt } from "./fmt";
import type * as aqua from "../../aqua";

vi.mock("@actions/core", () => ({
  startGroup: vi.fn(),
  endGroup: vi.fn(),
}));

vi.mock("../../aqua", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../aqua")>();
  return {
    ...actual,
    checkTerrgruntRun: vi.fn(),
  };
});

const createMockExecutor = () => ({
  exec: vi.fn().mockResolvedValue(0),
  getExecOutput: vi.fn().mockResolvedValue({
    exitCode: 0,
    stdout: "",
    stderr: "",
  }),
  installDir: "/mock/install",
  githubToken: "mock-token",
  env: vi.fn(),
  buildArgs: vi.fn(),
});

describe("fmt", () => {
  let mockExecutor: ReturnType<typeof createMockExecutor>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecutor = createMockExecutor();
  });

  it("terraform fmt", async () => {
    const core = await import("@actions/core");
    await fmt(
      "terraform",
      "/work/dir",
      mockExecutor as unknown as aqua.Executor,
    );

    expect(core.startGroup).toHaveBeenCalledWith("terraform fmt");
    expect(mockExecutor.getExecOutput).toHaveBeenCalledWith(
      "terraform",
      ["fmt", "-recursive"],
      { cwd: "/work/dir" },
    );
    expect(core.endGroup).toHaveBeenCalledOnce();
  });

  it("tofu fmt", async () => {
    const core = await import("@actions/core");
    await fmt("tofu", "/work/dir", mockExecutor as unknown as aqua.Executor);

    expect(core.startGroup).toHaveBeenCalledWith("tofu fmt");
    expect(mockExecutor.getExecOutput).toHaveBeenCalledWith(
      "tofu",
      ["fmt", "-recursive"],
      { cwd: "/work/dir" },
    );
    expect(core.endGroup).toHaveBeenCalledOnce();
  });

  it("terragrunt with run available", async () => {
    const core = await import("@actions/core");
    const aquaMod = await import("../../aqua");
    vi.mocked(aquaMod.checkTerrgruntRun).mockResolvedValue(true);

    await fmt(
      "terragrunt",
      "/work/dir",
      mockExecutor as unknown as aqua.Executor,
    );

    expect(core.startGroup).toHaveBeenCalledWith("terragrunt run -- fmt");
    expect(mockExecutor.getExecOutput).toHaveBeenCalledWith(
      "terragrunt",
      ["run", "--", "fmt", "-recursive"],
      { cwd: "/work/dir" },
    );
    expect(core.endGroup).toHaveBeenCalledOnce();
  });

  it("terragrunt with run unavailable", async () => {
    const core = await import("@actions/core");
    const aquaMod = await import("../../aqua");
    vi.mocked(aquaMod.checkTerrgruntRun).mockResolvedValue(false);

    await fmt(
      "terragrunt",
      "/work/dir",
      mockExecutor as unknown as aqua.Executor,
    );

    expect(core.startGroup).toHaveBeenCalledWith("terragrunt fmt");
    expect(mockExecutor.getExecOutput).toHaveBeenCalledWith(
      "terragrunt",
      ["fmt", "-recursive"],
      { cwd: "/work/dir" },
    );
    expect(core.endGroup).toHaveBeenCalledOnce();
  });

  it("does not call checkTerrgruntRun for non-terragrunt", async () => {
    const aquaMod = await import("../../aqua");

    await fmt(
      "terraform",
      "/work/dir",
      mockExecutor as unknown as aqua.Executor,
    );

    expect(aquaMod.checkTerrgruntRun).not.toHaveBeenCalled();
  });

  it("returns getExecOutput result", async () => {
    const expectedResult = {
      exitCode: 0,
      stdout: "main.tf\n",
      stderr: "",
    };
    mockExecutor.getExecOutput.mockResolvedValue(expectedResult);

    const result = await fmt(
      "terraform",
      "/work/dir",
      mockExecutor as unknown as aqua.Executor,
    );

    expect(result).toBe(expectedResult);
  });
});
