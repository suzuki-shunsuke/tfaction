import { describe, it, expect, vi, beforeEach } from "vitest";
import { run, type RunInput } from "./run";

vi.mock("../aqua", () => ({
  NewExecutor: vi.fn().mockResolvedValue({}),
}));

import * as aqua from "../aqua";

const mockedNewExecutor = vi.mocked(aqua.NewExecutor);

describe("run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls aqua.NewExecutor with the provided githubToken", async () => {
    const input: RunInput = {
      githubToken: "my-token",
      aquaGlobalConfig: "/path/to/config",
      exportVariable: vi.fn(),
    };
    await run(input);
    expect(mockedNewExecutor).toHaveBeenCalledWith({
      githubToken: "my-token",
    });
  });

  it("calls exportVariable with AQUA_GLOBAL_CONFIG and the config value", async () => {
    const exportVariable = vi.fn();
    const input: RunInput = {
      githubToken: "token",
      aquaGlobalConfig: "/custom/aqua-global.yaml",
      exportVariable,
    };
    await run(input);
    expect(exportVariable).toHaveBeenCalledWith(
      "AQUA_GLOBAL_CONFIG",
      "/custom/aqua-global.yaml",
    );
  });

  it("calls exportVariable after NewExecutor resolves", async () => {
    const callOrder: string[] = [];
    mockedNewExecutor.mockImplementation(async () => {
      callOrder.push("NewExecutor");
      return {} as aqua.Executor;
    });
    const exportVariable = vi.fn().mockImplementation(() => {
      callOrder.push("exportVariable");
    });
    const input: RunInput = {
      githubToken: "token",
      aquaGlobalConfig: "/path/to/config",
      exportVariable,
    };
    await run(input);
    expect(callOrder).toEqual(["NewExecutor", "exportVariable"]);
  });

  it("handles empty githubToken", async () => {
    const exportVariable = vi.fn();
    const input: RunInput = {
      githubToken: "",
      aquaGlobalConfig: "/path/to/config",
      exportVariable,
    };
    await run(input);
    expect(mockedNewExecutor).toHaveBeenCalledWith({
      githubToken: "",
    });
    expect(exportVariable).toHaveBeenCalledWith(
      "AQUA_GLOBAL_CONFIG",
      "/path/to/config",
    );
  });

  it("propagates error when NewExecutor rejects", async () => {
    mockedNewExecutor.mockRejectedValue(new Error("install failed"));
    const exportVariable = vi.fn();
    const input: RunInput = {
      githubToken: "token",
      aquaGlobalConfig: "/path/to/config",
      exportVariable,
    };
    await expect(run(input)).rejects.toThrow("install failed");
    expect(exportVariable).not.toHaveBeenCalled();
  });
});
