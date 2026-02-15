import { describe, it, expect, vi, beforeEach } from "vitest";
import { run, type RunInput, type Logger } from "./index";

describe("run", () => {
  const createMockExecutor = () => ({
    getExecOutput: vi.fn(),
    exec: vi.fn(),
  });

  const createMockLogger = (): Logger => ({
    info: vi.fn(),
    setOutput: vi.fn(),
  });

  // Empty SARIF output (no results)
  const emptySarifOutput = JSON.stringify({
    runs: [{ results: [] }],
  });

  // SARIF output with a file reference
  const sarifOutputWithFile = (uri: string) =>
    JSON.stringify({
      runs: [
        {
          results: [
            {
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri },
                  },
                },
              ],
            },
          ],
        },
      ],
    });

  const createMockInput = (overrides?: Partial<RunInput>): RunInput => ({
    executor: createMockExecutor() as unknown as RunInput["executor"],
    workingDirectory: "/repo/work",
    gitRootDir: "/repo",
    githubToken: "token",
    githubTokenForTflintInit: "",
    githubTokenForFix: "",
    fix: false,
    serverRepository: "",
    securefixActionAppId: "",
    securefixActionAppPrivateKey: "",
    tflint: { enabled: true, fix: false },
    eventName: "pull_request",
    logger: createMockLogger(),
    createCommit: vi.fn().mockResolvedValue(""),
    checkGitDiff: vi.fn().mockResolvedValue({ changedFiles: [] }),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws error when github_token is empty", async () => {
    const input = createMockInput({ githubToken: "" });

    await expect(run(input)).rejects.toThrow("github_token is required");
  });

  it("uses githubToken when githubTokenForTflintInit is not provided", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: emptySarifOutput,
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "-fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input = createMockInput({
      executor: executor as unknown as RunInput["executor"],
      githubToken: "main-token",
      githubTokenForTflintInit: "",
    });

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith(
      "tflint",
      ["--init"],
      expect.objectContaining({
        env: { GITHUB_TOKEN: "main-token" },
      }),
    );
  });

  it("uses githubTokenForTflintInit when provided", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: emptySarifOutput,
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "-fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input = createMockInput({
      executor: executor as unknown as RunInput["executor"],
      githubToken: "main-token",
      githubTokenForTflintInit: "init-token",
    });

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith(
      "tflint",
      ["--init"],
      expect.objectContaining({
        env: { GITHUB_TOKEN: "init-token" },
      }),
    );
  });

  it("adds --call-module-type=all when tflint supports it", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({
        stdout: "Usage: tflint [OPTIONS] --call-module-type",
        stderr: "",
      })
      .mockResolvedValueOnce({
        stdout: emptySarifOutput,
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "-fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input = createMockInput({
      executor: executor as unknown as RunInput["executor"],
    });

    await run(input);

    expect(executor.getExecOutput).toHaveBeenCalledWith(
      "tflint",
      expect.arrayContaining(["--format", "sarif", "--call-module-type=all"]),
      expect.any(Object),
    );
  });

  it("adds --module when tflint does not support --call-module-type", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({
        stdout: "Usage: tflint [OPTIONS]",
        stderr: "",
      })
      .mockResolvedValueOnce({
        stdout: emptySarifOutput,
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "-fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input = createMockInput({
      executor: executor as unknown as RunInput["executor"],
    });

    await run(input);

    expect(executor.getExecOutput).toHaveBeenCalledWith(
      "tflint",
      expect.arrayContaining(["--format", "sarif", "--module"]),
      expect.any(Object),
    );
  });

  it("adds --fix when fix is true", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: emptySarifOutput,
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input = createMockInput({
      executor: executor as unknown as RunInput["executor"],
      fix: true,
    });

    await run(input);

    expect(executor.getExecOutput).toHaveBeenCalledWith(
      "tflint",
      expect.arrayContaining(["--fix"]),
      expect.any(Object),
    );
  });

  it("passes SARIF output to reviewdog", async () => {
    const executor = createMockExecutor();
    const sarifOutput = sarifOutputWithFile("main.tf");
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: sarifOutput,
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "-fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input = createMockInput({
      executor: executor as unknown as RunInput["executor"],
    });

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining(["-f", "sarif"]),
      expect.objectContaining({
        input: Buffer.from(sarifOutput),
      }),
    );
  });

  it("uses github-pr-review reporter for pull_request event", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: emptySarifOutput,
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "-fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input = createMockInput({
      executor: executor as unknown as RunInput["executor"],
      eventName: "pull_request",
    });

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining(["-reporter", "github-pr-review"]),
      expect.any(Object),
    );
  });

  it("uses github-check reporter for push event", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: emptySarifOutput,
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "-fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input = createMockInput({
      executor: executor as unknown as RunInput["executor"],
      eventName: "push",
    });

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining(["-reporter", "github-check"]),
      expect.any(Object),
    );
  });

  it("uses -fail-level when reviewdog supports it", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: emptySarifOutput,
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "some help text with -fail-level option",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input = createMockInput({
      executor: executor as unknown as RunInput["executor"],
      tflint: {
        enabled: true,
        fix: false,
        reviewdog: { fail_level: "error" },
      },
    });

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining(["-fail-level", "error"]),
      expect.any(Object),
    );
  });

  it("uses -fail-level when reviewdog help shows it in stderr", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: emptySarifOutput,
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "",
        stderr: "some help text with -fail-level option",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input = createMockInput({
      executor: executor as unknown as RunInput["executor"],
    });

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining(["-fail-level", "any"]),
      expect.any(Object),
    );
  });

  it("uses -fail-on-error when reviewdog does not support -fail-level", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: emptySarifOutput,
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "old reviewdog without fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input = createMockInput({
      executor: executor as unknown as RunInput["executor"],
    });

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining(["-fail-on-error", "1"]),
      expect.any(Object),
    );
  });

  it("returns early when fix is true and no results", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: emptySarifOutput,
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input = createMockInput({
      executor: executor as unknown as RunInput["executor"],
      fix: true,
    });

    await run(input);

    // Should not call reviewdog when returning early
    expect(executor.exec).not.toHaveBeenCalledWith(
      "reviewdog",
      expect.any(Array),
      expect.any(Object),
    );
  });

  it("creates commit when fix is true and files are changed", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: sarifOutputWithFile("main.tf"),
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const createCommit = vi.fn().mockResolvedValue("");
    const checkGitDiff = vi.fn().mockResolvedValue({
      changedFiles: ["main.tf"],
    });
    const logger = createMockLogger();

    const input = createMockInput({
      executor: executor as unknown as RunInput["executor"],
      fix: true,
      createCommit,
      checkGitDiff,
      logger,
      githubTokenForFix: "fix-token",
      serverRepository: "server-repo",
      securefixActionAppId: "app-id",
      securefixActionAppPrivateKey: "app-key",
    });

    await expect(run(input)).rejects.toThrow("code is fixed by tflint --fix");

    expect(logger.setOutput).toHaveBeenCalledWith("fixed_files", "main.tf");
    expect(createCommit).toHaveBeenCalledWith({
      commitMessage: "fix(tflint): auto fix",
      githubToken: "fix-token",
      files: new Set(["main.tf"]),
      serverRepository: "server-repo",
      appId: "app-id",
      appPrivateKey: "app-key",
    });
  });

  it("does not create commit when fix is true but no files changed", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: sarifOutputWithFile("main.tf"),
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "-fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const createCommit = vi.fn().mockResolvedValue("");
    const checkGitDiff = vi.fn().mockResolvedValue({
      changedFiles: [],
    });

    const input = createMockInput({
      executor: executor as unknown as RunInput["executor"],
      fix: true,
      createCommit,
      checkGitDiff,
    });

    await run(input);

    expect(createCommit).not.toHaveBeenCalled();
  });

  it("uses default fail_level 'any' when not configured", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: emptySarifOutput,
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "-fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input = createMockInput({
      executor: executor as unknown as RunInput["executor"],
      tflint: { enabled: true, fix: false },
    });

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining(["-fail-level", "any"]),
      expect.any(Object),
    );
  });

  it("uses default filter_mode 'nofilter' when not configured", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: emptySarifOutput,
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "-fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input = createMockInput({
      executor: executor as unknown as RunInput["executor"],
      tflint: { enabled: true, fix: false },
    });

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining(["-filter-mode", "nofilter"]),
      expect.any(Object),
    );
  });

  it("uses githubTokenForFix when provided", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: sarifOutputWithFile("main.tf"),
        stderr: "",
        exitCode: 0,
      });

    const createCommit = vi.fn().mockResolvedValue("");
    const checkGitDiff = vi.fn().mockResolvedValue({
      changedFiles: ["main.tf"],
    });

    const input = createMockInput({
      executor: executor as unknown as RunInput["executor"],
      fix: true,
      githubToken: "main-token",
      githubTokenForFix: "fix-token",
      createCommit,
      checkGitDiff,
    });

    await expect(run(input)).rejects.toThrow("code is fixed by tflint --fix");

    expect(createCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        githubToken: "fix-token",
      }),
    );
  });

  it("uses githubToken when githubTokenForFix is not provided", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: sarifOutputWithFile("main.tf"),
        stderr: "",
        exitCode: 0,
      });

    const createCommit = vi.fn().mockResolvedValue("");
    const checkGitDiff = vi.fn().mockResolvedValue({
      changedFiles: ["main.tf"],
    });

    const input = createMockInput({
      executor: executor as unknown as RunInput["executor"],
      fix: true,
      githubToken: "main-token",
      githubTokenForFix: "",
      createCommit,
      checkGitDiff,
    });

    await expect(run(input)).rejects.toThrow("code is fixed by tflint --fix");

    expect(createCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        githubToken: "main-token",
      }),
    );
  });
});
