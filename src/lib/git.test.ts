import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@actions/exec", () => ({
  exec: vi.fn(),
  getExecOutput: vi.fn(),
}));

import * as exec from "@actions/exec";
import {
  getModifiedFiles,
  hasFileChanged,
  isFileTracked,
  getCurrentBranch,
  hasFileChangedPorcelain,
  listWorkingDirFiles,
  getRootDir,
  checkGitDiff,
} from "./git";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getModifiedFiles", () => {
  it("returns list of modified/untracked files from git output", async () => {
    vi.mocked(exec.exec).mockImplementation(async (_cmd, _args, options) => {
      options?.listeners?.stdout?.(Buffer.from("file1.tf\nfile2.tf\n"));
      return 0;
    });
    const result = await getModifiedFiles(".");
    expect(result).toEqual(["file1.tf", "file2.tf"]);
  });

  it("filters out empty lines", async () => {
    vi.mocked(exec.exec).mockImplementation(async (_cmd, _args, options) => {
      options?.listeners?.stdout?.(Buffer.from("file1.tf\n\n\nfile2.tf\n"));
      return 0;
    });
    const result = await getModifiedFiles(".");
    expect(result).toEqual(["file1.tf", "file2.tf"]);
  });

  it("trims whitespace from file names", async () => {
    vi.mocked(exec.exec).mockImplementation(async (_cmd, _args, options) => {
      options?.listeners?.stdout?.(Buffer.from("  file1.tf  \n  file2.tf  \n"));
      return 0;
    });
    const result = await getModifiedFiles(".");
    expect(result).toEqual(["file1.tf", "file2.tf"]);
  });

  it("returns empty array when no files modified", async () => {
    vi.mocked(exec.exec).mockImplementation(async (_cmd, _args, options) => {
      options?.listeners?.stdout?.(Buffer.from(""));
      return 0;
    });
    const result = await getModifiedFiles(".");
    expect(result).toEqual([]);
  });

  it("passes dir and cwd to exec correctly", async () => {
    vi.mocked(exec.exec).mockImplementation(async (_cmd, _args, options) => {
      options?.listeners?.stdout?.(Buffer.from(""));
      return 0;
    });
    await getModifiedFiles("src", "/workspace");
    expect(exec.exec).toHaveBeenCalledWith(
      "git",
      ["ls-files", "--modified", "--others", "--exclude-standard", "src"],
      expect.objectContaining({ cwd: "/workspace" }),
    );
  });
});

describe("hasFileChanged", () => {
  it("returns true when exit code is non-zero (file changed)", async () => {
    vi.mocked(exec.exec).mockResolvedValue(1);
    const result = await hasFileChanged("main.tf");
    expect(result).toBe(true);
  });

  it("returns false when exit code is 0 (file unchanged)", async () => {
    vi.mocked(exec.exec).mockResolvedValue(0);
    const result = await hasFileChanged("main.tf");
    expect(result).toBe(false);
  });

  it("passes correct args including ignoreReturnCode: true", async () => {
    vi.mocked(exec.exec).mockResolvedValue(0);
    await hasFileChanged("main.tf", "/workspace");
    expect(exec.exec).toHaveBeenCalledWith(
      "git",
      ["diff", "--quiet", "--", "main.tf"],
      expect.objectContaining({
        cwd: "/workspace",
        ignoreReturnCode: true,
        silent: true,
      }),
    );
  });
});

describe("isFileTracked", () => {
  it("returns true when exit code is 0 (file tracked)", async () => {
    vi.mocked(exec.exec).mockResolvedValue(0);
    const result = await isFileTracked("main.tf");
    expect(result).toBe(true);
  });

  it("returns false when exit code is non-zero (file untracked)", async () => {
    vi.mocked(exec.exec).mockResolvedValue(1);
    const result = await isFileTracked("main.tf");
    expect(result).toBe(false);
  });
});

describe("getCurrentBranch", () => {
  it("returns trimmed branch name", async () => {
    vi.mocked(exec.exec).mockImplementation(async (_cmd, _args, options) => {
      options?.listeners?.stdout?.(Buffer.from("feature/my-branch\n"));
      return 0;
    });
    const result = await getCurrentBranch();
    expect(result).toBe("feature/my-branch");
  });

  it("passes cwd to exec", async () => {
    vi.mocked(exec.exec).mockImplementation(async (_cmd, _args, options) => {
      options?.listeners?.stdout?.(Buffer.from("main\n"));
      return 0;
    });
    await getCurrentBranch("/workspace");
    expect(exec.exec).toHaveBeenCalledWith(
      "git",
      ["branch", "--show-current"],
      expect.objectContaining({ cwd: "/workspace" }),
    );
  });
});

describe("hasFileChangedPorcelain", () => {
  it("returns true when output is non-empty (file changed)", async () => {
    vi.mocked(exec.exec).mockImplementation(async (_cmd, _args, options) => {
      options?.listeners?.stdout?.(Buffer.from(" M main.tf\n"));
      return 0;
    });
    const result = await hasFileChangedPorcelain("main.tf");
    expect(result).toBe(true);
  });

  it("returns false when output is empty (file unchanged)", async () => {
    vi.mocked(exec.exec).mockImplementation(async (_cmd, _args, options) => {
      options?.listeners?.stdout?.(Buffer.from(""));
      return 0;
    });
    const result = await hasFileChangedPorcelain("main.tf");
    expect(result).toBe(false);
  });
});

describe("listWorkingDirFiles", () => {
  it("returns list of matching file paths", async () => {
    vi.mocked(exec.getExecOutput).mockResolvedValue({
      stdout: "aws/dev/tfaction.yaml\ngcp/prod/tfaction.yaml\n",
      stderr: "",
      exitCode: 0,
    });
    const result = await listWorkingDirFiles("/workspace", "tfaction.yaml");
    expect(result).toEqual(["aws/dev/tfaction.yaml", "gcp/prod/tfaction.yaml"]);
  });

  it("filters out empty lines", async () => {
    vi.mocked(exec.getExecOutput).mockResolvedValue({
      stdout: "aws/dev/tfaction.yaml\n\n\ngcp/prod/tfaction.yaml\n",
      stderr: "",
      exitCode: 0,
    });
    const result = await listWorkingDirFiles("/workspace", "tfaction.yaml");
    expect(result).toEqual(["aws/dev/tfaction.yaml", "gcp/prod/tfaction.yaml"]);
  });

  it("passes gitRootDir as cwd and correct pattern", async () => {
    vi.mocked(exec.getExecOutput).mockResolvedValue({
      stdout: "",
      stderr: "",
      exitCode: 0,
    });
    await listWorkingDirFiles("/workspace", "tfaction.yaml");
    expect(exec.getExecOutput).toHaveBeenCalledWith(
      "git",
      ["ls-files", "*/tfaction.yaml"],
      expect.objectContaining({
        cwd: "/workspace",
        ignoreReturnCode: true,
        silent: true,
      }),
    );
  });
});

describe("getRootDir", () => {
  it("returns trimmed output of git rev-parse --show-toplevel", async () => {
    vi.mocked(exec.getExecOutput).mockResolvedValue({
      stdout: "/home/runner/work/repo\n",
      stderr: "",
      exitCode: 0,
    });
    const result = await getRootDir("/workspace");
    expect(result).toBe("/home/runner/work/repo");
  });
});

describe("checkGitDiff", () => {
  it("returns only changed files from the input list", async () => {
    vi.mocked(exec.exec)
      .mockImplementationOnce(async (_cmd, _args, options) => {
        options?.listeners?.stdout?.(Buffer.from(" M file1.tf\n"));
        return 0;
      })
      .mockImplementationOnce(async (_cmd, _args, options) => {
        options?.listeners?.stdout?.(Buffer.from(""));
        return 0;
      })
      .mockImplementationOnce(async (_cmd, _args, options) => {
        options?.listeners?.stdout?.(Buffer.from("?? file3.tf\n"));
        return 0;
      });
    const result = await checkGitDiff(["file1.tf", "file2.tf", "file3.tf"]);
    expect(result).toEqual({ changedFiles: ["file1.tf", "file3.tf"] });
  });

  it("returns empty array when no files changed", async () => {
    vi.mocked(exec.exec).mockImplementation(async (_cmd, _args, options) => {
      options?.listeners?.stdout?.(Buffer.from(""));
      return 0;
    });
    const result = await checkGitDiff(["file1.tf", "file2.tf"]);
    expect(result).toEqual({ changedFiles: [] });
  });
});
