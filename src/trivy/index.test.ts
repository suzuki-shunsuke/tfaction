import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSeverity,
  generateTable,
  run,
  type RunInput,
  type Diagnostic,
  type Logger,
} from "./index";
import type { Config } from "../lib/types";

describe("getSeverity", () => {
  it("returns ERROR for HIGH severity", () => {
    expect(getSeverity("HIGH")).toBe("ERROR");
  });

  it("returns ERROR for CRITICAL severity", () => {
    expect(getSeverity("CRITICAL")).toBe("ERROR");
  });

  it("returns WARNING for MEDIUM severity", () => {
    expect(getSeverity("MEDIUM")).toBe("WARNING");
  });

  it("returns INFO for LOW severity", () => {
    expect(getSeverity("LOW")).toBe("INFO");
  });

  it("returns empty string for unknown severity", () => {
    expect(getSeverity("UNKNOWN")).toBe("");
    expect(getSeverity("")).toBe("");
  });

  it("handles severity with additional text", () => {
    expect(getSeverity("HIGH (score: 9.0)")).toBe("ERROR");
    expect(getSeverity("CRITICAL-security")).toBe("ERROR");
    expect(getSeverity("MEDIUM-risk")).toBe("WARNING");
    expect(getSeverity("LOW-priority")).toBe("INFO");
  });
});

describe("generateTable", () => {
  it("returns header only for empty diagnostics", () => {
    const result = generateTable([], "/base/path");
    expect(result).toBe(
      "rule | severity | filepath | range | message\n--- | --- | --- | --- | ---",
    );
  });

  it("generates markdown link when URL is present", () => {
    const diagnostics: Diagnostic[] = [
      {
        message: "Test message",
        code: {
          value: "AVD-AWS-0001",
          url: "https://avd.aquasec.com/misconfig/avd-aws-0001",
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
    const result = generateTable(diagnostics, "/base/path");
    expect(result).toContain(
      "[AVD-AWS-0001](https://avd.aquasec.com/misconfig/avd-aws-0001)",
    );
  });

  it("generates plain text when URL is not present", () => {
    const diagnostics: Diagnostic[] = [
      {
        message: "Test message",
        code: {
          value: "CUSTOM-001",
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
    const result = generateTable(diagnostics, "/base/path");
    expect(result).toContain("CUSTOM-001 |");
    expect(result).not.toContain("[CUSTOM-001]");
  });

  it("converts absolute path to relative path", () => {
    const diagnostics: Diagnostic[] = [
      {
        message: "Test message",
        code: { value: "TEST-001", url: "" },
        location: {
          path: "/base/path/subdir/main.tf",
          range: {
            start: { line: 1 },
            end: { line: 2 },
          },
        },
        severity: "ERROR",
      },
    ];
    const result = generateTable(diagnostics, "/base/path");
    expect(result).toContain("subdir/main.tf");
  });

  it("keeps relative path as-is", () => {
    const diagnostics: Diagnostic[] = [
      {
        message: "Test message",
        code: { value: "TEST-001", url: "" },
        location: {
          path: "modules/main.tf",
          range: {
            start: { line: 1 },
            end: { line: 2 },
          },
        },
        severity: "ERROR",
      },
    ];
    const result = generateTable(diagnostics, "/base/path");
    expect(result).toContain("modules/main.tf");
  });

  it("includes all diagnostic fields in table row", () => {
    const diagnostics: Diagnostic[] = [
      {
        message: "S3 bucket has versioning disabled",
        code: { value: "AVD-AWS-0088", url: "https://example.com" },
        location: {
          path: "storage.tf",
          range: {
            start: { line: 20 },
            end: { line: 25 },
          },
        },
        severity: "WARNING",
      },
    ];
    const result = generateTable(diagnostics, "/base/path");
    const lines = result.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[2]).toContain("AVD-AWS-0088");
    expect(lines[2]).toContain("WARNING");
    expect(lines[2]).toContain("storage.tf");
    expect(lines[2]).toContain("20 ... 25");
    expect(lines[2]).toContain("S3 bucket has versioning disabled");
  });
});

describe("run", () => {
  const createMockExecutor = () => ({
    getExecOutput: vi.fn(),
    exec: vi.fn(),
  });

  const createMockLogger = (): Logger => ({
    info: vi.fn(),
  });

  const createMockConfig = (overrides?: Partial<Config>): Config => ({
    draft_pr: false,
    label_prefixes: { skip: "skip:", tfmigrate: "tfmigrate:" },
    module_file: "tfaction_module.yaml",
    plan_workflow_name: "plan",
    renovate_login: "renovate[bot]",
    skip_create_pr: false,
    target_groups: [],
    tflint: { enabled: true, fix: false },
    trivy: { enabled: true },
    terraform_command: "terraform",
    working_directory_file: "tfaction.yaml",
    git_root_dir: "/repo",
    config_path: "/repo/tfaction-root.yaml",
    config_dir: "/repo",
    workspace: "/repo",
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns early when trivy Results is null", async () => {
    const executor = createMockExecutor();
    const logger = createMockLogger();
    executor.getExecOutput.mockResolvedValueOnce({
      stdout: JSON.stringify({ Results: null }),
      stderr: "",
      exitCode: 0,
    });

    const input: RunInput = {
      executor: executor as unknown as RunInput["executor"],
      workingDirectory: "/work",
      githubToken: "token",
      configPath: "",
      config: createMockConfig(),
      eventName: "pull_request",
      logger,
      githubCommentConfig: "/path/to/config.yaml",
    };

    await run(input);

    expect(logger.info).toHaveBeenCalledWith("trivy config is null");
    expect(executor.exec).not.toHaveBeenCalled();
  });

  it("parses trivy Results and creates diagnostics", async () => {
    const executor = createMockExecutor();
    const logger = createMockLogger();

    const trivyOutput = {
      Results: [
        {
          Target: "main.tf",
          Misconfigurations: [
            {
              ID: "AVD-AWS-0001",
              Message: "Test error",
              PrimaryURL: "https://example.com",
              Severity: "HIGH",
              CauseMetadata: {
                StartLine: 10,
                EndLine: 15,
              },
            },
          ],
        },
      ],
    };

    executor.getExecOutput
      .mockResolvedValueOnce({
        stdout: JSON.stringify(trivyOutput),
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "-fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input: RunInput = {
      executor: executor as unknown as RunInput["executor"],
      workingDirectory: "/work",
      githubToken: "token",
      configPath: "",
      config: createMockConfig(),
      eventName: "pull_request",
      logger,
      githubCommentConfig: "/path/to/config.yaml",
    };

    await run(input);

    // Should call github-comment for nofilter mode
    expect(executor.exec).toHaveBeenCalledWith(
      "github-comment",
      ["post", "-stdin-template"],
      expect.objectContaining({
        env: expect.objectContaining({
          GITHUB_TOKEN: "token",
        }),
      }),
    );

    // Should call reviewdog
    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining([
        "-f",
        "rdjson",
        "-name",
        "trivy",
        "-reporter",
        "github-pr-review",
      ]),
      expect.any(Object),
    );
  });

  it("passes --config flag when configPath is provided", async () => {
    const executor = createMockExecutor();
    const logger = createMockLogger();

    executor.getExecOutput.mockResolvedValueOnce({
      stdout: JSON.stringify({ Results: null }),
      stderr: "",
      exitCode: 0,
    });

    const input: RunInput = {
      executor: executor as unknown as RunInput["executor"],
      workingDirectory: "/work",
      githubToken: "token",
      configPath: "/path/to/trivy.yaml",
      config: createMockConfig(),
      eventName: "pull_request",
      logger,
      githubCommentConfig: "/path/to/config.yaml",
    };

    await run(input);

    expect(executor.getExecOutput).toHaveBeenCalledWith(
      "trivy",
      ["config", "--format", "json", "--config", "/path/to/trivy.yaml", "."],
      expect.any(Object),
    );
  });

  it("does not pass --config flag when configPath is empty", async () => {
    const executor = createMockExecutor();
    const logger = createMockLogger();

    executor.getExecOutput.mockResolvedValueOnce({
      stdout: JSON.stringify({ Results: null }),
      stderr: "",
      exitCode: 0,
    });

    const input: RunInput = {
      executor: executor as unknown as RunInput["executor"],
      workingDirectory: "/work",
      githubToken: "token",
      configPath: "",
      config: createMockConfig(),
      eventName: "pull_request",
      logger,
      githubCommentConfig: "/path/to/config.yaml",
    };

    await run(input);

    expect(executor.getExecOutput).toHaveBeenCalledWith(
      "trivy",
      ["config", "--format", "json", "."],
      expect.any(Object),
    );
  });

  it("does not call github-comment when filterMode is not nofilter", async () => {
    const executor = createMockExecutor();
    const logger = createMockLogger();

    const trivyOutput = {
      Results: [
        {
          Target: "main.tf",
          Misconfigurations: [
            {
              ID: "AVD-AWS-0001",
              Message: "Test error",
              PrimaryURL: "https://example.com",
              Severity: "HIGH",
              CauseMetadata: {
                StartLine: 10,
                EndLine: 15,
              },
            },
          ],
        },
      ],
    };

    executor.getExecOutput
      .mockResolvedValueOnce({
        stdout: JSON.stringify(trivyOutput),
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "-fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input: RunInput = {
      executor: executor as unknown as RunInput["executor"],
      workingDirectory: "/work",
      githubToken: "token",
      configPath: "",
      config: createMockConfig({
        trivy: {
          enabled: true,
          reviewdog: { filter_mode: "added" },
        },
      }),
      eventName: "pull_request",
      logger,
      githubCommentConfig: "/path/to/config.yaml",
    };

    await run(input);

    // Should NOT call github-comment
    expect(executor.exec).not.toHaveBeenCalledWith(
      "github-comment",
      expect.any(Array),
      expect.any(Object),
    );

    // Should still call reviewdog
    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining(["-filter-mode", "added"]),
      expect.any(Object),
    );
  });

  it("does not call github-comment when diagnostics is empty", async () => {
    const executor = createMockExecutor();
    const logger = createMockLogger();

    const trivyOutput = {
      Results: [
        {
          Target: "main.tf",
          Misconfigurations: [],
        },
      ],
    };

    executor.getExecOutput
      .mockResolvedValueOnce({
        stdout: JSON.stringify(trivyOutput),
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "-fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input: RunInput = {
      executor: executor as unknown as RunInput["executor"],
      workingDirectory: "/work",
      githubToken: "token",
      configPath: "",
      config: createMockConfig(),
      eventName: "pull_request",
      logger,
      githubCommentConfig: "/path/to/config.yaml",
    };

    await run(input);

    // Should NOT call github-comment
    expect(executor.exec).not.toHaveBeenCalledWith(
      "github-comment",
      expect.any(Array),
      expect.any(Object),
    );
  });

  it("uses github-pr-review reporter for pull_request event", async () => {
    const executor = createMockExecutor();
    const logger = createMockLogger();

    executor.getExecOutput
      .mockResolvedValueOnce({
        stdout: JSON.stringify({ Results: [] }),
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "-fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input: RunInput = {
      executor: executor as unknown as RunInput["executor"],
      workingDirectory: "/work",
      githubToken: "token",
      configPath: "",
      config: createMockConfig(),
      eventName: "pull_request",
      logger,
      githubCommentConfig: "/path/to/config.yaml",
    };

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining(["-reporter", "github-pr-review"]),
      expect.any(Object),
    );
  });

  it("uses github-check reporter for push event", async () => {
    const executor = createMockExecutor();
    const logger = createMockLogger();

    executor.getExecOutput
      .mockResolvedValueOnce({
        stdout: JSON.stringify({ Results: [] }),
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "-fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input: RunInput = {
      executor: executor as unknown as RunInput["executor"],
      workingDirectory: "/work",
      githubToken: "token",
      configPath: "",
      config: createMockConfig(),
      eventName: "push",
      logger,
      githubCommentConfig: "/path/to/config.yaml",
    };

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining(["-reporter", "github-check"]),
      expect.any(Object),
    );
  });

  it("uses -fail-level when reviewdog supports it", async () => {
    const executor = createMockExecutor();
    const logger = createMockLogger();

    executor.getExecOutput
      .mockResolvedValueOnce({
        stdout: JSON.stringify({ Results: [] }),
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "some help text with -fail-level option",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input: RunInput = {
      executor: executor as unknown as RunInput["executor"],
      workingDirectory: "/work",
      githubToken: "token",
      configPath: "",
      config: createMockConfig({
        trivy: {
          enabled: true,
          reviewdog: { fail_level: "error" },
        },
      }),
      eventName: "pull_request",
      logger,
      githubCommentConfig: "/path/to/config.yaml",
    };

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining(["-fail-level", "error"]),
      expect.any(Object),
    );
  });

  it("uses -fail-level when reviewdog help shows it in stderr", async () => {
    const executor = createMockExecutor();
    const logger = createMockLogger();

    executor.getExecOutput
      .mockResolvedValueOnce({
        stdout: JSON.stringify({ Results: [] }),
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "",
        stderr: "some help text with -fail-level option",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input: RunInput = {
      executor: executor as unknown as RunInput["executor"],
      workingDirectory: "/work",
      githubToken: "token",
      configPath: "",
      config: createMockConfig(),
      eventName: "pull_request",
      logger,
      githubCommentConfig: "/path/to/config.yaml",
    };

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining(["-fail-level", "any"]),
      expect.any(Object),
    );
  });

  it("uses -fail-on-error when reviewdog does not support -fail-level", async () => {
    const executor = createMockExecutor();
    const logger = createMockLogger();

    executor.getExecOutput
      .mockResolvedValueOnce({
        stdout: JSON.stringify({ Results: [] }),
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "old reviewdog without fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input: RunInput = {
      executor: executor as unknown as RunInput["executor"],
      workingDirectory: "/work",
      githubToken: "token",
      configPath: "",
      config: createMockConfig(),
      eventName: "pull_request",
      logger,
      githubCommentConfig: "/path/to/config.yaml",
    };

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining(["-fail-on-error", "1"]),
      expect.any(Object),
    );
  });

  it("throws error when trivy exitCode is not 0", async () => {
    const executor = createMockExecutor();
    const logger = createMockLogger();

    executor.getExecOutput
      .mockResolvedValueOnce({
        stdout: JSON.stringify({ Results: [] }),
        stderr: "",
        exitCode: 1,
      })
      .mockResolvedValueOnce({
        stdout: "-fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input: RunInput = {
      executor: executor as unknown as RunInput["executor"],
      workingDirectory: "/work",
      githubToken: "token",
      configPath: "",
      config: createMockConfig(),
      eventName: "pull_request",
      logger,
      githubCommentConfig: "/path/to/config.yaml",
    };

    await expect(run(input)).rejects.toThrow("trivy failed");
  });

  it("skips Results with null Misconfigurations", async () => {
    const executor = createMockExecutor();
    const logger = createMockLogger();

    const trivyOutput = {
      Results: [
        {
          Target: "main.tf",
          Misconfigurations: null,
        },
        {
          Target: "other.tf",
          // Misconfigurations is undefined
        },
      ],
    };

    executor.getExecOutput
      .mockResolvedValueOnce({
        stdout: JSON.stringify(trivyOutput),
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "-fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input: RunInput = {
      executor: executor as unknown as RunInput["executor"],
      workingDirectory: "/work",
      githubToken: "token",
      configPath: "",
      config: createMockConfig(),
      eventName: "pull_request",
      logger,
      githubCommentConfig: "/path/to/config.yaml",
    };

    await run(input);

    // Should not call github-comment since no diagnostics
    expect(executor.exec).not.toHaveBeenCalledWith(
      "github-comment",
      expect.any(Array),
      expect.any(Object),
    );
  });

  it("uses default fail_level 'any' when not configured", async () => {
    const executor = createMockExecutor();
    const logger = createMockLogger();

    executor.getExecOutput
      .mockResolvedValueOnce({
        stdout: JSON.stringify({ Results: [] }),
        stderr: "",
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "-fail-level",
        stderr: "",
        exitCode: 0,
      });
    executor.exec.mockResolvedValue(0);

    const input: RunInput = {
      executor: executor as unknown as RunInput["executor"],
      workingDirectory: "/work",
      githubToken: "token",
      configPath: "",
      config: createMockConfig({
        trivy: { enabled: true },
      }),
      eventName: "pull_request",
      logger,
      githubCommentConfig: "/path/to/config.yaml",
    };

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining(["-fail-level", "any"]),
      expect.any(Object),
    );
  });
});
