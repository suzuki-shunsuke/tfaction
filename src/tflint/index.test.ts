import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSeverity,
  generateTable,
  run,
  type RunInput,
  type Diagnostic,
  type Logger,
} from "./index";

describe("getSeverity", () => {
  it("returns ERROR for error severity", () => {
    expect(getSeverity("error")).toBe("ERROR");
  });

  it("returns WARNING for warning severity", () => {
    expect(getSeverity("warning")).toBe("WARNING");
  });

  it("returns INFO for info severity", () => {
    expect(getSeverity("info")).toBe("INFO");
  });

  it("returns empty string for unknown severity", () => {
    expect(getSeverity("unknown")).toBe("");
    expect(getSeverity("")).toBe("");
    expect(getSeverity("ERROR")).toBe("");
    expect(getSeverity("WARNING")).toBe("");
  });
});

describe("generateTable", () => {
  it("returns header only for empty diagnostics", () => {
    const result = generateTable([]);
    expect(result).toBe(
      "rule | severity | filepath | range | message\n--- | --- | --- | --- | ---",
    );
  });

  it("generates markdown link when URL is present", () => {
    const diagnostics: Diagnostic[] = [
      {
        message: "Test message",
        code: {
          value: "terraform_unused_declarations",
          url: "https://github.com/terraform-linters/tflint-ruleset-terraform/blob/v0.1.0/docs/rules/terraform_unused_declarations.md",
        },
        location: {
          path: "main.tf",
          range: {
            start: { line: 10 },
            end: { line: 15 },
          },
        },
        severity: "ERROR",
      },
    ];
    const result = generateTable(diagnostics);
    expect(result).toContain(
      "[terraform_unused_declarations](https://github.com/terraform-linters/tflint-ruleset-terraform/blob/v0.1.0/docs/rules/terraform_unused_declarations.md)",
    );
  });

  it("generates plain text when URL is not present", () => {
    const diagnostics: Diagnostic[] = [
      {
        message: "Test message",
        code: {
          value: "custom_rule",
          url: "",
        },
        location: {
          path: "main.tf",
          range: {
            start: { line: 5 },
            end: { line: 8 },
          },
        },
        severity: "WARNING",
      },
    ];
    const result = generateTable(diagnostics);
    expect(result).toContain("custom_rule |");
    expect(result).not.toContain("[custom_rule]");
  });

  it("includes all diagnostic fields in table row", () => {
    const diagnostics: Diagnostic[] = [
      {
        message: "Unused variable declaration",
        code: {
          value: "terraform_unused_declarations",
          url: "https://example.com",
        },
        location: {
          path: "variables.tf",
          range: {
            start: { line: 20 },
            end: { line: 25 },
          },
        },
        severity: "WARNING",
      },
    ];
    const result = generateTable(diagnostics);
    const lines = result.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[2]).toContain("terraform_unused_declarations");
    expect(lines[2]).toContain("WARNING");
    expect(lines[2]).toContain("variables.tf");
    expect(lines[2]).toContain("20 ... 25");
    expect(lines[2]).toContain("Unused variable declaration");
  });

  it("handles multiple diagnostics", () => {
    const diagnostics: Diagnostic[] = [
      {
        message: "First message",
        code: { value: "rule1", url: "https://example.com/1" },
        location: {
          path: "main.tf",
          range: { start: { line: 1 }, end: { line: 2 } },
        },
        severity: "ERROR",
      },
      {
        message: "Second message",
        code: { value: "rule2", url: "" },
        location: {
          path: "other.tf",
          range: { start: { line: 10 }, end: { line: 20 } },
        },
        severity: "INFO",
      },
    ];
    const result = generateTable(diagnostics);
    const lines = result.split("\n");
    expect(lines).toHaveLength(4);
    expect(lines[2]).toContain("[rule1]");
    expect(lines[3]).toContain("rule2 |");
    expect(lines[3]).not.toContain("[rule2]");
  });
});

describe("run", () => {
  const createMockExecutor = () => ({
    getExecOutput: vi.fn(),
    exec: vi.fn(),
  });

  const createMockLogger = (): Logger => ({
    startGroup: vi.fn(),
    endGroup: vi.fn(),
    info: vi.fn(),
    setOutput: vi.fn(),
  });

  const createMockInput = (overrides?: Partial<RunInput>): RunInput => ({
    executor: createMockExecutor() as unknown as RunInput["executor"],
    workingDirectory: "/work",
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
    githubCommentConfig: "/path/to/config.yaml",
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
        stdout: JSON.stringify({ issues: [], errors: [] }),
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
        stdout: JSON.stringify({ issues: [], errors: [] }),
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
        stdout: JSON.stringify({ issues: [], errors: [] }),
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
      expect.arrayContaining(["--format", "json", "--call-module-type=all"]),
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
        stdout: JSON.stringify({ issues: [], errors: [] }),
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
      expect.arrayContaining(["--format", "json", "--module"]),
      expect.any(Object),
    );
  });

  it("adds --fix when fix is true", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: JSON.stringify({ issues: [], errors: [] }),
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
      fix: true,
    });

    await run(input);

    expect(executor.getExecOutput).toHaveBeenCalledWith(
      "tflint",
      expect.arrayContaining(["--fix"]),
      expect.any(Object),
    );
  });

  it("parses tflint issues correctly", async () => {
    const executor = createMockExecutor();
    const tflintOutput = {
      issues: [
        {
          message: "Unused variable",
          rule: {
            name: "terraform_unused_declarations",
            link: "https://example.com/rule",
            severity: "warning",
          },
          range: {
            filename: "main.tf",
            start: { line: 10 },
            end: { line: 15 },
          },
        },
      ],
      errors: [],
    };

    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: JSON.stringify(tflintOutput),
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

    // Should call github-comment for nofilter mode with diagnostics
    expect(executor.exec).toHaveBeenCalledWith(
      "github-comment",
      ["post", "-stdin-template"],
      expect.objectContaining({
        env: expect.objectContaining({
          GITHUB_TOKEN: "token",
        }),
      }),
    );
  });

  it("parses tflint errors correctly", async () => {
    const executor = createMockExecutor();
    const tflintOutput = {
      issues: [],
      errors: [
        {
          message: "Parse error",
          severity: "error",
          range: {
            filename: "broken.tf",
            start: { line: 5 },
            end: { line: 5 },
          },
        },
      ],
    };

    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: JSON.stringify(tflintOutput),
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
      "github-comment",
      ["post", "-stdin-template"],
      expect.any(Object),
    );
  });

  it("does not call github-comment when filterMode is not nofilter", async () => {
    const executor = createMockExecutor();
    const tflintOutput = {
      issues: [
        {
          message: "Warning",
          rule: { name: "test_rule", link: "", severity: "warning" },
          range: { filename: "main.tf", start: { line: 1 }, end: { line: 1 } },
        },
      ],
      errors: [],
    };

    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: JSON.stringify(tflintOutput),
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
      tflint: {
        enabled: true,
        fix: false,
        reviewdog: { filter_mode: "added" },
      },
    });

    await run(input);

    expect(executor.exec).not.toHaveBeenCalledWith(
      "github-comment",
      expect.any(Array),
      expect.any(Object),
    );
  });

  it("does not call github-comment when diagnostics is empty", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: JSON.stringify({ issues: [], errors: [] }),
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

    expect(executor.exec).not.toHaveBeenCalledWith(
      "github-comment",
      expect.any(Array),
      expect.any(Object),
    );
  });

  it("uses github-pr-review reporter for pull_request event", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: JSON.stringify({ issues: [], errors: [] }),
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
        stdout: JSON.stringify({ issues: [], errors: [] }),
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
        stdout: JSON.stringify({ issues: [], errors: [] }),
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
        stdout: JSON.stringify({ issues: [], errors: [] }),
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
        stdout: JSON.stringify({ issues: [], errors: [] }),
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

  it("returns early when fix is true and no diagnostics", async () => {
    const executor = createMockExecutor();
    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: JSON.stringify({ issues: [], errors: [] }),
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
    const tflintOutput = {
      issues: [
        {
          message: "Warning",
          rule: { name: "test_rule", link: "", severity: "warning" },
          range: { filename: "main.tf", start: { line: 1 }, end: { line: 1 } },
        },
      ],
      errors: [],
    };

    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: JSON.stringify(tflintOutput),
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
    const tflintOutput = {
      issues: [
        {
          message: "Warning",
          rule: { name: "test_rule", link: "", severity: "warning" },
          range: { filename: "main.tf", start: { line: 1 }, end: { line: 1 } },
        },
      ],
      errors: [],
    };

    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: JSON.stringify(tflintOutput),
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
        stdout: JSON.stringify({ issues: [], errors: [] }),
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
        stdout: JSON.stringify({ issues: [], errors: [] }),
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
    const tflintOutput = {
      issues: [
        {
          message: "Warning",
          rule: { name: "test_rule", link: "", severity: "warning" },
          range: { filename: "main.tf", start: { line: 1 }, end: { line: 1 } },
        },
      ],
      errors: [],
    };

    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: JSON.stringify(tflintOutput),
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
    const tflintOutput = {
      issues: [
        {
          message: "Warning",
          rule: { name: "test_rule", link: "", severity: "warning" },
          range: { filename: "main.tf", start: { line: 1 }, end: { line: 1 } },
        },
      ],
      errors: [],
    };

    executor.getExecOutput
      .mockResolvedValueOnce({ stdout: "--call-module-type", stderr: "" })
      .mockResolvedValueOnce({
        stdout: JSON.stringify(tflintOutput),
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
