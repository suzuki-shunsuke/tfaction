import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@actions/exec", () => ({
  exec: vi.fn(),
  getExecOutput: vi.fn(),
}));

vi.mock("@actions/core", () => ({
  startGroup: vi.fn(),
  endGroup: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  addPath: vi.fn(),
  summary: {
    addRaw: vi.fn().mockReturnThis(),
    write: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../lib", () => ({
  aquaGlobalConfig: "/path/to/aqua.yaml",
}));

vi.mock("../lib/env", () => ({
  all: {
    PATH: "/usr/bin",
    AQUA_ROOT_DIR: "",
    XDG_DATA_HOME: "",
    AQUA_GLOBAL_CONFIG: "",
  },
}));

vi.mock("../comment/exec", () => ({
  execAndComment: vi.fn(),
}));

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { execAndComment } from "../comment/exec";
import { Executor, buildFailureSummary } from "./index";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildFailureSummary", () => {
  it("includes joined command and fenced output body", () => {
    const out = buildFailureSummary("terraform", ["init"], "boom\n");
    expect(out).toBe("## :x: `terraform init` failed\n\n```\nboom\n```\n");
  });

  it("omits the fenced block when output is empty", () => {
    expect(buildFailureSummary("aqua", ["i"], "")).toBe(
      "## :x: `aqua i` failed\n",
    );
    expect(buildFailureSummary("aqua", ["i"], "   \n  ")).toBe(
      "## :x: `aqua i` failed\n",
    );
  });

  it("handles missing args", () => {
    expect(buildFailureSummary("ls", undefined, "x")).toBe(
      "## :x: `ls` failed\n\n```\nx\n```\n",
    );
  });
});

describe("Executor.exec failure summary", () => {
  it("writes Job Summary when command fails and ignoreReturnCode is not set", async () => {
    vi.mocked(exec.exec).mockImplementation((_cmd, _args, options) => {
      options?.listeners?.stdout?.(Buffer.from("stdout-line\n"));
      options?.listeners?.stderr?.(Buffer.from("stderr-line\n"));
      return Promise.reject(new Error("Command failed with exit code 1"));
    });

    const executor = new Executor("");
    await expect(
      executor.exec("terraform", ["init"], { cwd: "/wd" }),
    ).rejects.toThrow("Command failed with exit code 1");

    expect(core.summary.addRaw).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(core.summary.addRaw).mock.calls[0][0];
    expect(arg).toBe(
      "## :x: `terraform init` failed\n\n```\nstdout-line\nstderr-line\n```\n",
    );
    expect(core.summary.write).toHaveBeenCalledTimes(1);
  });

  it("does not write a summary when ignoreReturnCode is true", async () => {
    vi.mocked(exec.exec).mockResolvedValue(1);

    const executor = new Executor("");
    const code = await executor.exec("tflint", ["--format", "sarif"], {
      ignoreReturnCode: true,
    });

    expect(code).toBe(1);
    expect(core.summary.addRaw).not.toHaveBeenCalled();
    expect(core.summary.write).not.toHaveBeenCalled();
  });

  it("does not write a summary when the command succeeds", async () => {
    vi.mocked(exec.exec).mockResolvedValue(0);

    const executor = new Executor("");
    await executor.exec("terraform", ["init"]);

    expect(core.summary.addRaw).not.toHaveBeenCalled();
    expect(core.summary.write).not.toHaveBeenCalled();
  });

  it("still invokes caller-provided listeners while capturing for the summary", async () => {
    const userStdout = vi.fn();
    const userStderr = vi.fn();

    vi.mocked(exec.exec).mockImplementation((_cmd, _args, options) => {
      options?.listeners?.stdout?.(Buffer.from("a"));
      options?.listeners?.stderr?.(Buffer.from("b"));
      return Promise.reject(new Error("fail"));
    });

    const executor = new Executor("");
    await expect(
      executor.exec("trivy", ["config", "."], {
        listeners: { stdout: userStdout, stderr: userStderr },
      }),
    ).rejects.toThrow("fail");

    expect(userStdout).toHaveBeenCalledWith(Buffer.from("a"));
    expect(userStderr).toHaveBeenCalledWith(Buffer.from("b"));
    expect(vi.mocked(core.summary.addRaw).mock.calls[0][0]).toContain(
      "## :x: `trivy config .` failed",
    );
  });

  it("ends the log group even when the command fails", async () => {
    vi.mocked(exec.exec).mockRejectedValue(new Error("nope"));

    const executor = new Executor("");
    await expect(
      executor.exec("aqua", ["i"], { group: "aqua install" }),
    ).rejects.toThrow("nope");

    expect(core.startGroup).toHaveBeenCalledWith("aqua install");
    expect(core.endGroup).toHaveBeenCalledTimes(1);
  });

  it("skips the generic summary when execAndComment posted a PR comment (avoids duplication)", async () => {
    vi.mocked(execAndComment).mockImplementation((_cmd, _args, _c, opts) => {
      opts?.listeners?.stdout?.(Buffer.from("comment-output\n"));
      return Promise.resolve({
        exitCode: 2,
        stdout: "comment-output\n",
        stderr: "",
        commentPosted: true,
      });
    });

    const executor = new Executor("");
    await expect(
      executor.exec("terraform", ["plan"], {
        comment: { token: "t" },
      }),
    ).rejects.toThrow("Command failed with exit code 2: terraform plan");

    expect(core.summary.addRaw).not.toHaveBeenCalled();
    expect(core.summary.write).not.toHaveBeenCalled();
  });

  it("writes the generic summary when execAndComment did NOT post a PR comment", async () => {
    vi.mocked(execAndComment).mockImplementation((_cmd, _args, _c, opts) => {
      opts?.listeners?.stdout?.(Buffer.from("no-template-output\n"));
      return Promise.resolve({
        exitCode: 3,
        stdout: "no-template-output\n",
        stderr: "",
        commentPosted: false,
      });
    });

    const executor = new Executor("");
    await expect(
      executor.exec("terraform", ["plan"], {
        comment: { token: "t" },
      }),
    ).rejects.toThrow("Command failed with exit code 3: terraform plan");

    expect(core.summary.addRaw).toHaveBeenCalledTimes(1);
    expect(vi.mocked(core.summary.addRaw).mock.calls[0][0]).toBe(
      "## :x: `terraform plan` failed\n\n```\nno-template-output\n```\n",
    );
  });

  it("does not throw when execAndComment returns success with commentPosted=true", async () => {
    vi.mocked(execAndComment).mockResolvedValue({
      exitCode: 0,
      stdout: "",
      stderr: "",
      commentPosted: true,
    });

    const executor = new Executor("");
    const code = await executor.exec("terraform", ["plan"], {
      comment: { token: "t" },
    });

    expect(code).toBe(0);
    expect(core.summary.addRaw).not.toHaveBeenCalled();
  });

  it("does not throw or write a generic summary when comment + ignoreReturnCode + non-zero exit", async () => {
    vi.mocked(execAndComment).mockResolvedValue({
      exitCode: 4,
      stdout: "",
      stderr: "",
      commentPosted: false,
    });

    const executor = new Executor("");
    const code = await executor.exec("terraform", ["plan"], {
      comment: { token: "t" },
      ignoreReturnCode: true,
    });

    expect(code).toBe(4);
    expect(core.summary.addRaw).not.toHaveBeenCalled();
  });
});

describe("Executor.getExecOutput failure summary", () => {
  it("writes Job Summary on failure when ignoreReturnCode is not set", async () => {
    vi.mocked(exec.getExecOutput).mockImplementation((_cmd, _args, options) => {
      options?.listeners?.stdout?.(Buffer.from("hello\n"));
      return Promise.reject(new Error("Command failed"));
    });

    const executor = new Executor("");
    await expect(executor.getExecOutput("tflint", ["--help"])).rejects.toThrow(
      "Command failed",
    );

    expect(core.summary.addRaw).toHaveBeenCalledTimes(1);
    expect(vi.mocked(core.summary.addRaw).mock.calls[0][0]).toBe(
      "## :x: `tflint --help` failed\n\n```\nhello\n```\n",
    );
  });

  it("does not write a summary when ignoreReturnCode is true", async () => {
    vi.mocked(exec.getExecOutput).mockResolvedValue({
      exitCode: 1,
      stdout: "",
      stderr: "",
    });

    const executor = new Executor("");
    await executor.getExecOutput("tflint", ["--init"], {
      ignoreReturnCode: true,
    });

    expect(core.summary.addRaw).not.toHaveBeenCalled();
  });
});
