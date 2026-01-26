import { describe, it, expect, vi, beforeEach } from "vitest";
import { findConfigFile, run, type RunInput, type FileSystem } from "./index";

describe("findConfigFile", () => {
  const createMockFs = (existingPaths: string[]): FileSystem => ({
    existsSync: (path: string) => existingPaths.includes(path),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
  });

  it("returns .terraform-docs.yml when found in working directory", () => {
    const fs = createMockFs(["/work/.terraform-docs.yml"]);
    const result = findConfigFile("/work", "/repo", fs);
    expect(result).toBe(".terraform-docs.yml");
  });

  it("returns .terraform-docs.yaml when found in working directory", () => {
    const fs = createMockFs(["/work/.terraform-docs.yaml"]);
    const result = findConfigFile("/work", "/repo", fs);
    expect(result).toBe(".terraform-docs.yaml");
  });

  it("returns .config/.terraform-docs.yml when found in working directory", () => {
    const fs = createMockFs(["/work/.config/.terraform-docs.yml"]);
    const result = findConfigFile("/work", "/repo", fs);
    expect(result).toBe(".config/.terraform-docs.yml");
  });

  it("returns .config/.terraform-docs.yaml when found in working directory", () => {
    const fs = createMockFs(["/work/.config/.terraform-docs.yaml"]);
    const result = findConfigFile("/work", "/repo", fs);
    expect(result).toBe(".config/.terraform-docs.yaml");
  });

  it("returns full path when config file is found in repository root", () => {
    const fs = createMockFs(["/repo/.terraform-docs.yml"]);
    const result = findConfigFile("/work", "/repo", fs);
    expect(result).toBe("/repo/.terraform-docs.yml");
  });

  it("returns full path for .terraform-docs.yaml in repository root", () => {
    const fs = createMockFs(["/repo/.terraform-docs.yaml"]);
    const result = findConfigFile("/work", "/repo", fs);
    expect(result).toBe("/repo/.terraform-docs.yaml");
  });

  it("prefers working directory over repository root", () => {
    const fs = createMockFs([
      "/work/.terraform-docs.yaml",
      "/repo/.terraform-docs.yml",
    ]);
    const result = findConfigFile("/work", "/repo", fs);
    expect(result).toBe(".terraform-docs.yaml");
  });

  it("prefers .terraform-docs.yml over .terraform-docs.yaml in same directory", () => {
    const fs = createMockFs([
      "/work/.terraform-docs.yml",
      "/work/.terraform-docs.yaml",
    ]);
    const result = findConfigFile("/work", "/repo", fs);
    expect(result).toBe(".terraform-docs.yml");
  });

  it("returns empty string when no config file is found", () => {
    const fs = createMockFs([]);
    const result = findConfigFile("/work", "/repo", fs);
    expect(result).toBe("");
  });
});

describe("run", () => {
  const createMockExecutor = () => ({
    exec: vi.fn().mockResolvedValue(0),
    getExecOutput: vi.fn(),
  });

  const createMockFs = (config: {
    existingPaths?: string[];
    fileContents?: Map<string, string>;
    writtenFiles?: Map<string, string>;
  }): FileSystem => {
    const existingPaths = config.existingPaths ?? [];
    const fileContents = config.fileContents ?? new Map();
    const writtenFiles = config.writtenFiles ?? new Map();
    return {
      existsSync: (path: string) => existingPaths.includes(path),
      readFileSync: (path: string) => fileContents.get(path) ?? "",
      writeFileSync: (path: string, data: string) =>
        writtenFiles.set(path, data),
    };
  };

  const createBaseInput = (overrides?: Partial<RunInput>): RunInput => {
    const writtenFiles = new Map<string, string>();
    return {
      workingDirectory: "/work",
      repoRoot: "/repo",
      githubToken: "token",
      securefixActionAppId: "app-id",
      securefixActionAppPrivateKey: "private-key",
      securefixActionServerRepository: "",
      executor: createMockExecutor() as unknown as RunInput["executor"],
      eventName: "pull_request",
      target: "target",
      fs: createMockFs({
        existingPaths: ["/work/README.md", "/work/.terraform-docs.yml"],
        fileContents: new Map([
          [
            "/work/README.md",
            "<!-- BEGIN_TF_DOCS -->\nold content\n<!-- END_TF_DOCS -->",
          ],
        ]),
        writtenFiles,
      }),
      createTempFile: () => ({
        name: "/tmp/terraform-docs-output",
        removeCallback: vi.fn(),
      }),
      commitCreate: vi.fn().mockResolvedValue(""),
      execGetExecOutput: vi.fn().mockResolvedValue({
        stdout: "",
        stderr: "",
        exitCode: 0,
      }),
      ...overrides,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates README.md when it does not exist", async () => {
    const writtenFiles = new Map<string, string>();
    const input = createBaseInput({
      fs: createMockFs({
        existingPaths: ["/work/.terraform-docs.yml"],
        fileContents: new Map(),
        writtenFiles,
      }),
    });

    const executor = input.executor as unknown as ReturnType<
      typeof createMockExecutor
    >;
    executor.getExecOutput.mockResolvedValue({
      stdout: "# Module\n\nGenerated docs",
      stderr: "",
      exitCode: 0,
    });

    // Simulate that README.md was created (git diff returns non-zero)
    const execGetExecOutput = vi.fn().mockResolvedValue({
      stdout: "",
      stderr: "",
      exitCode: 1,
    });
    input.execGetExecOutput = execGetExecOutput;

    await expect(run(input)).rejects.toThrow(
      "document is generated by terraform-docs",
    );

    expect(input.commitCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        commitMessage: "docs: generate document by terraform-docs",
        files: new Set(["/work/README.md"]),
      }),
    );
  });

  it("executes terraform-docs with config file when found", async () => {
    const input = createBaseInput();
    const executor = input.executor as unknown as ReturnType<
      typeof createMockExecutor
    >;
    executor.getExecOutput.mockResolvedValue({
      stdout: "# Module",
      stderr: "",
      exitCode: 0,
    });

    await run(input);

    expect(executor.getExecOutput).toHaveBeenCalledWith(
      "terraform-docs",
      ["-c", ".terraform-docs.yml", "."],
      expect.objectContaining({
        cwd: "/work",
        ignoreReturnCode: true,
      }),
    );
  });

  it("executes terraform-docs with markdown mode when no config file found", async () => {
    const input = createBaseInput({
      fs: createMockFs({
        existingPaths: ["/work/README.md"],
        fileContents: new Map([
          [
            "/work/README.md",
            "<!-- BEGIN_TF_DOCS -->\nold content\n<!-- END_TF_DOCS -->",
          ],
        ]),
      }),
    });
    const executor = input.executor as unknown as ReturnType<
      typeof createMockExecutor
    >;
    executor.getExecOutput.mockResolvedValue({
      stdout: "# Module",
      stderr: "",
      exitCode: 0,
    });

    await run(input);

    expect(executor.getExecOutput).toHaveBeenCalledWith(
      "terraform-docs",
      ["markdown", "."],
      expect.objectContaining({
        cwd: "/work",
      }),
    );
  });

  it("throws error when terraform-docs returns non-zero exit code", async () => {
    const input = createBaseInput();
    const executor = input.executor as unknown as ReturnType<
      typeof createMockExecutor
    >;
    executor.getExecOutput.mockResolvedValue({
      stdout: "",
      stderr: "error",
      exitCode: 1,
    });

    await expect(run(input)).rejects.toThrow(
      "terraform-docs failed with exit code 1",
    );
  });

  it("throws error when output contains Available Commands (missing config)", async () => {
    const writtenFiles = new Map<string, string>();
    const input = createBaseInput({
      fs: createMockFs({
        existingPaths: ["/work/README.md"],
        fileContents: new Map([
          ["/work/README.md", "<!-- BEGIN_TF_DOCS -->"],
          [
            "/tmp/terraform-docs-output",
            "Available Commands:\n  help  Print this help message",
          ],
        ]),
        writtenFiles,
      }),
    });
    // Override readFileSync to return the written content
    const fs = input.fs!;
    const originalReadFileSync = fs.readFileSync;
    fs.readFileSync = (path: string, encoding: BufferEncoding) => {
      if (writtenFiles.has(path)) {
        return writtenFiles.get(path) ?? "";
      }
      return originalReadFileSync(path, encoding);
    };

    const executor = input.executor as unknown as ReturnType<
      typeof createMockExecutor
    >;
    executor.getExecOutput.mockResolvedValue({
      stdout: "Available Commands:\n  help  Print this help message",
      stderr: "",
      exitCode: 0,
    });

    await expect(run(input)).rejects.toThrow(".terraform-docs.yml is required");
  });

  it("writes output to README.md when BEGIN_TF_DOCS marker is missing", async () => {
    const writtenFiles = new Map<string, string>();
    const input = createBaseInput({
      fs: createMockFs({
        existingPaths: ["/work/README.md", "/work/.terraform-docs.yml"],
        fileContents: new Map([
          ["/work/README.md", "# Old README without marker"],
        ]),
        writtenFiles,
      }),
    });
    // Override readFileSync to return the written content for temp file
    const fs = input.fs!;
    const originalReadFileSync = fs.readFileSync;
    fs.readFileSync = (path: string, encoding: BufferEncoding) => {
      if (writtenFiles.has(path)) {
        return writtenFiles.get(path) ?? "";
      }
      return originalReadFileSync(path, encoding);
    };

    const executor = input.executor as unknown as ReturnType<
      typeof createMockExecutor
    >;
    executor.getExecOutput.mockResolvedValue({
      stdout: "# New Generated Content",
      stderr: "",
      exitCode: 0,
    });

    await run(input);

    expect(writtenFiles.get("/work/README.md")).toBe("# New Generated Content");
  });

  it("does not modify README.md when it has BEGIN_TF_DOCS marker", async () => {
    const writtenFiles = new Map<string, string>();
    const existingContent =
      "# Module\n\n<!-- BEGIN_TF_DOCS -->\nold docs\n<!-- END_TF_DOCS -->";
    const input = createBaseInput({
      fs: createMockFs({
        existingPaths: ["/work/README.md", "/work/.terraform-docs.yml"],
        fileContents: new Map([["/work/README.md", existingContent]]),
        writtenFiles,
      }),
    });
    // Override readFileSync to return the written content for temp file
    const fs = input.fs!;
    const originalReadFileSync = fs.readFileSync;
    fs.readFileSync = (path: string, encoding: BufferEncoding) => {
      if (writtenFiles.has(path)) {
        return writtenFiles.get(path) ?? "";
      }
      return originalReadFileSync(path, encoding);
    };

    const executor = input.executor as unknown as ReturnType<
      typeof createMockExecutor
    >;
    executor.getExecOutput.mockResolvedValue({
      stdout: "# New Generated Content",
      stderr: "",
      exitCode: 0,
    });

    await run(input);

    // README.md should not be written (only temp file)
    expect(writtenFiles.has("/work/README.md")).toBe(false);
  });

  it("does nothing when README.md has no changes", async () => {
    const input = createBaseInput();
    const executor = input.executor as unknown as ReturnType<
      typeof createMockExecutor
    >;
    executor.getExecOutput.mockResolvedValue({
      stdout: "# Module",
      stderr: "",
      exitCode: 0,
    });

    // git diff returns 0 (no changes)
    input.execGetExecOutput = vi.fn().mockResolvedValue({
      stdout: "",
      stderr: "",
      exitCode: 0,
    });

    await run(input);

    expect(input.commitCreate).not.toHaveBeenCalled();
  });

  it("throws error when README.md changes on non-pull_request event", async () => {
    const writtenFiles = new Map<string, string>();
    const input = createBaseInput({
      eventName: "push",
      fs: createMockFs({
        existingPaths: ["/work/README.md", "/work/.terraform-docs.yml"],
        fileContents: new Map([["/work/README.md", "<!-- BEGIN_TF_DOCS -->"]]),
        writtenFiles,
      }),
    });
    // Override readFileSync to return the written content for temp file
    const fs = input.fs!;
    const originalReadFileSync = fs.readFileSync;
    fs.readFileSync = (path: string, encoding: BufferEncoding) => {
      if (writtenFiles.has(path)) {
        return writtenFiles.get(path) ?? "";
      }
      return originalReadFileSync(path, encoding);
    };

    const executor = input.executor as unknown as ReturnType<
      typeof createMockExecutor
    >;
    executor.getExecOutput.mockResolvedValue({
      stdout: "# Module",
      stderr: "",
      exitCode: 0,
    });

    // git diff returns non-zero (changes detected)
    input.execGetExecOutput = vi.fn().mockResolvedValue({
      stdout: "",
      stderr: "",
      exitCode: 1,
    });

    await expect(run(input)).rejects.toThrow(
      "Please generate Module's README.md with terraform-docs.",
    );
  });

  it("creates commit when README.md changes on pull_request event", async () => {
    const writtenFiles = new Map<string, string>();
    const input = createBaseInput({
      eventName: "pull_request",
      fs: createMockFs({
        existingPaths: ["/work/README.md", "/work/.terraform-docs.yml"],
        fileContents: new Map([["/work/README.md", "<!-- BEGIN_TF_DOCS -->"]]),
        writtenFiles,
      }),
    });
    // Override readFileSync to return the written content for temp file
    const fs = input.fs!;
    const originalReadFileSync = fs.readFileSync;
    fs.readFileSync = (path: string, encoding: BufferEncoding) => {
      if (writtenFiles.has(path)) {
        return writtenFiles.get(path) ?? "";
      }
      return originalReadFileSync(path, encoding);
    };

    const executor = input.executor as unknown as ReturnType<
      typeof createMockExecutor
    >;
    executor.getExecOutput.mockResolvedValue({
      stdout: "# Module",
      stderr: "",
      exitCode: 0,
    });

    // git diff returns non-zero (changes detected)
    input.execGetExecOutput = vi.fn().mockResolvedValue({
      stdout: "",
      stderr: "",
      exitCode: 1,
    });

    await expect(run(input)).rejects.toThrow(
      "document is generated by terraform-docs",
    );

    expect(input.commitCreate).toHaveBeenCalledWith({
      githubToken: "token",
      commitMessage: "docs: generate document by terraform-docs",
      appId: "app-id",
      appPrivateKey: "private-key",
      serverRepository: "",
      files: new Set(["/work/README.md"]),
    });
  });

  it("creates commit when README.md changes on pull_request_target event", async () => {
    const writtenFiles = new Map<string, string>();
    const input = createBaseInput({
      eventName: "pull_request_target",
      fs: createMockFs({
        existingPaths: ["/work/README.md", "/work/.terraform-docs.yml"],
        fileContents: new Map([["/work/README.md", "<!-- BEGIN_TF_DOCS -->"]]),
        writtenFiles,
      }),
    });
    // Override readFileSync to return the written content for temp file
    const fs = input.fs!;
    const originalReadFileSync = fs.readFileSync;
    fs.readFileSync = (path: string, encoding: BufferEncoding) => {
      if (writtenFiles.has(path)) {
        return writtenFiles.get(path) ?? "";
      }
      return originalReadFileSync(path, encoding);
    };

    const executor = input.executor as unknown as ReturnType<
      typeof createMockExecutor
    >;
    executor.getExecOutput.mockResolvedValue({
      stdout: "# Module",
      stderr: "",
      exitCode: 0,
    });

    // git diff returns non-zero (changes detected)
    input.execGetExecOutput = vi.fn().mockResolvedValue({
      stdout: "",
      stderr: "",
      exitCode: 1,
    });

    await expect(run(input)).rejects.toThrow(
      "document is generated by terraform-docs",
    );

    expect(input.commitCreate).toHaveBeenCalled();
  });

  it("cleans up temp file even when error occurs", async () => {
    const removeCallback = vi.fn();
    const input = createBaseInput({
      createTempFile: () => ({
        name: "/tmp/terraform-docs-output",
        removeCallback,
      }),
    });

    const executor = input.executor as unknown as ReturnType<
      typeof createMockExecutor
    >;
    executor.getExecOutput.mockResolvedValue({
      stdout: "",
      stderr: "",
      exitCode: 1,
    });

    await expect(run(input)).rejects.toThrow();

    expect(removeCallback).toHaveBeenCalled();
  });

  it("checks terraform-docs version before running", async () => {
    const input = createBaseInput();
    const executor = input.executor as unknown as ReturnType<
      typeof createMockExecutor
    >;
    executor.getExecOutput.mockResolvedValue({
      stdout: "# Module",
      stderr: "",
      exitCode: 0,
    });

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith("terraform-docs", ["-v"], {
      cwd: "/work",
    });
  });

  it("passes tfactionTarget to comment vars", async () => {
    const input = createBaseInput({
      target: "my-target",
    });
    const executor = input.executor as unknown as ReturnType<
      typeof createMockExecutor
    >;
    executor.getExecOutput.mockResolvedValue({
      stdout: "# Module",
      stderr: "",
      exitCode: 0,
    });

    await run(input);

    expect(executor.getExecOutput).toHaveBeenCalledWith(
      "terraform-docs",
      expect.any(Array),
      expect.objectContaining({
        comment: expect.objectContaining({
          vars: { tfaction_target: "my-target" },
        }),
      }),
    );
  });
});
