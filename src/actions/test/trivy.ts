import * as core from "@actions/core";
import * as github from "@actions/github";

import * as aqua from "../../aqua";
import * as types from "../../lib/types";

export type Logger = {
  info: (message: string) => void;
  error: (message: string) => void;
  writeSummary: (content: string) => Promise<void>;
};

export type RunInput = {
  executor: aqua.Executor;
  workingDirectory: string;
  githubToken: string;
  configPath: string;
  trivy?: types.TrivyConfig;
  eventName?: string;
  logger?: Logger;
};

export const run = async (input: RunInput): Promise<void> => {
  const executor = input.executor;
  const eventName = input.eventName ?? github.context.eventName;
  const logger = input.logger ?? {
    info: core.info,
    error: core.error,
    writeSummary: async (content: string) => {
      core.summary.addRaw(content);
      await core.summary.write();
    },
  };

  const configFlags = input.configPath ? ["--config", input.configPath] : [];
  const sarifArgs = [
    "config",
    "--format",
    "sarif",
    "--exit-code",
    "1",
    ...configFlags,
    ".",
  ];
  const humanArgs = ["config", "--exit-code", "1", ...configFlags, "."];

  const out = await executor.getExecOutput("trivy", sarifArgs, {
    cwd: input.workingDirectory,
    ignoreReturnCode: true,
    group: "trivy",
  });

  if (out.exitCode !== 0) {
    logger.error("trivy failed");
    let combined = "";
    await executor.exec("trivy", humanArgs, {
      cwd: input.workingDirectory,
      ignoreReturnCode: true,
      listeners: {
        stdout: (data: Buffer) => {
          combined += data.toString();
        },
        stderr: (data: Buffer) => {
          combined += data.toString();
        },
      },
    });
    const body = combined.trim();
    if (body.length > 0) {
      await logger.writeSummary(`## trivy\n\n\`\`\`\n${body}\n\`\`\`\n`);
    }
  }

  const filterMode = input.trivy?.reviewdog?.filter_mode ?? "nofilter";

  const reporter =
    eventName == "pull_request" ? "github-pr-review" : "github-check";

  const reviewdogArgs = [
    "-f",
    "sarif",
    "-name",
    "trivy",
    "-filter-mode",
    filterMode,
    "-reporter",
    reporter,
    "-level",
    "warning",
  ];
  const failLevel = input.trivy?.reviewdog?.fail_level ?? "any";
  const reviewdogHelp = await executor.getExecOutput("reviewdog", ["--help"], {
    cwd: input.workingDirectory,
    silent: true,
    ignoreReturnCode: true,
  });
  if (
    reviewdogHelp.stdout.includes("-fail-level") ||
    reviewdogHelp.stderr.includes("-fail-level")
  ) {
    reviewdogArgs.push("-fail-level", failLevel);
  } else {
    reviewdogArgs.push("-fail-on-error", "1");
  }

  await executor.exec("reviewdog", reviewdogArgs, {
    input: Buffer.from(out.stdout),
    cwd: input.workingDirectory,
    group: "reviewdog -name trivy",
    env: {
      REVIEWDOG_GITHUB_API_TOKEN: input.githubToken,
    },
  });
  if (out.exitCode != 0) {
    throw new Error("trivy failed");
  }
};
