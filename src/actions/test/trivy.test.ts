import { describe, it, expect, vi, beforeEach } from "vitest";
import { run, type RunInput } from "./trivy";
import type { Config } from "../../lib/types";

describe("run", () => {
  const createMockExecutor = () => ({
    getExecOutput: vi.fn(),
    exec: vi.fn(),
  });

  const createMockConfig = (overrides?: Partial<Config>): Config => ({
    draft_pr: false,
    label_prefixes: { skip: "skip:", tfmigrate: "tfmigrate:" },
    plan_workflow_name: "plan",
    auto_apps: {
      logins: ["renovate[bot]", "dependabot[bot]"],
      allow_auto_merge_change: false,
    },
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

  it("calls reviewdog even when trivy output has null Results", async () => {
    const executor = createMockExecutor();
    const trivyStdout = JSON.stringify({ Results: null });
    executor.getExecOutput
      .mockResolvedValueOnce({
        stdout: trivyStdout,
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
      trivy: createMockConfig().trivy,
      eventName: "pull_request",
    };

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining(["-f", "sarif"]),
      expect.objectContaining({
        input: Buffer.from(trivyStdout),
      }),
    );
  });

  it("passes trivy SARIF output to reviewdog", async () => {
    const executor = createMockExecutor();

    const sarifOutput = JSON.stringify({
      runs: [{ results: [] }],
    });

    executor.getExecOutput
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

    const input: RunInput = {
      executor: executor as unknown as RunInput["executor"],
      workingDirectory: "/work",
      githubToken: "token",
      configPath: "",
      trivy: createMockConfig().trivy,
      eventName: "pull_request",
    };

    await run(input);

    // Should call reviewdog with SARIF format
    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining([
        "-f",
        "sarif",
        "-name",
        "trivy",
        "-reporter",
        "github-pr-review",
      ]),
      expect.objectContaining({
        input: Buffer.from(sarifOutput),
        env: {
          REVIEWDOG_GITHUB_API_TOKEN: "token",
        },
      }),
    );
  });

  it("passes --config flag when configPath is provided", async () => {
    const executor = createMockExecutor();

    executor.getExecOutput
      .mockResolvedValueOnce({
        stdout: JSON.stringify({ runs: [{ results: [] }] }),
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
      configPath: "/path/to/trivy.yaml",
      trivy: createMockConfig().trivy,
      eventName: "pull_request",
    };

    await run(input);

    expect(executor.getExecOutput).toHaveBeenCalledWith(
      "trivy",
      ["config", "--format", "sarif", "--config", "/path/to/trivy.yaml", "."],
      expect.any(Object),
    );
  });

  it("does not pass --config flag when configPath is empty", async () => {
    const executor = createMockExecutor();

    executor.getExecOutput
      .mockResolvedValueOnce({
        stdout: JSON.stringify({ runs: [{ results: [] }] }),
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
      trivy: createMockConfig().trivy,
      eventName: "pull_request",
    };

    await run(input);

    expect(executor.getExecOutput).toHaveBeenCalledWith(
      "trivy",
      ["config", "--format", "sarif", "."],
      expect.any(Object),
    );
  });

  it("does not call github-comment when filterMode is not nofilter", async () => {
    const executor = createMockExecutor();

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
      trivy: {
        enabled: true,
        reviewdog: { filter_mode: "added" },
      },
      eventName: "pull_request",
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
      trivy: createMockConfig().trivy,
      eventName: "pull_request",
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
      trivy: createMockConfig().trivy,
      eventName: "pull_request",
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
      trivy: createMockConfig().trivy,
      eventName: "push",
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
      trivy: {
        enabled: true,
        reviewdog: { fail_level: "error" },
      },
      eventName: "pull_request",
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
      trivy: createMockConfig().trivy,
      eventName: "pull_request",
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
      trivy: createMockConfig().trivy,
      eventName: "pull_request",
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
      trivy: createMockConfig().trivy,
      eventName: "pull_request",
    };

    await expect(run(input)).rejects.toThrow("trivy failed");
  });

  it("skips Results with null Misconfigurations", async () => {
    const executor = createMockExecutor();

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
      trivy: createMockConfig().trivy,
      eventName: "pull_request",
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
      trivy: { enabled: true },
      eventName: "pull_request",
    };

    await run(input);

    expect(executor.exec).toHaveBeenCalledWith(
      "reviewdog",
      expect.arrayContaining(["-fail-level", "any"]),
      expect.any(Object),
    );
  });
});
