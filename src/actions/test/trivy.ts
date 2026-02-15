import * as github from "@actions/github";

import * as aqua from "../../aqua";
import * as types from "../../lib/types";

export type Logger = {
  info: (message: string) => void;
};

export type RunInput = {
  executor: aqua.Executor;
  workingDirectory: string;
  githubToken: string;
  configPath: string;
  trivy?: types.TrivyConfig;
  eventName?: string;
};

export const run = async (input: RunInput): Promise<void> => {
  const args = input.configPath
    ? ["config", "--format", "sarif", "--config", input.configPath, "."]
    : ["config", "--format", "sarif", "."];
  const executor = input.executor;
  const eventName = input.eventName ?? github.context.eventName;
  const out = await executor.getExecOutput("trivy", args, {
    cwd: input.workingDirectory,
    ignoreReturnCode: true,
    group: "trivy",
  });

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
