import * as core from "@actions/core";
import * as github from "@actions/github";
import * as path from "path";
import * as aqua from "../../aqua";
import * as types from "../../lib/types";
import { checkGitDiff as defaultCheckGitDiff } from "../../lib/git";
import { create as defaultCreateCommit } from "../../commit";
import { listFiles } from "./sarif";

export type Logger = {
  info: (message: string) => void;
  error: (message: string) => void;
  setOutput: (name: string, value: string) => void;
  writeSummary: (content: string) => Promise<void>;
};

export type CommitCreator = (params: {
  commitMessage: string;
  githubToken: string;
  files: Set<string>;
  serverRepository: string;
  appId: string;
  appPrivateKey: string;
}) => Promise<string>;

export type GitDiffChecker = (
  files: string[],
  cwd: string,
) => Promise<{ changedFiles: string[] }>;

export type RunInput = {
  executor: aqua.Executor;
  /** absolute path to the working directory */
  workingDirectory: string;
  /** absolute path to the git root directory */
  gitRootDir: string;
  githubToken: string;
  githubTokenForTflintInit: string;
  githubTokenForFix: string;
  fix: boolean;
  serverRepository: string;
  csmAppId: string;
  csmAppPrivateKey: string;
  tflint?: types.TflintConfig;
  eventName?: string;
  logger?: Logger;
  githubCommentConfig?: string;
  createCommit?: CommitCreator;
  checkGitDiff?: GitDiffChecker;
};

export const run = async (input: RunInput): Promise<void> => {
  if (!input.githubToken) {
    throw new Error("github_token is required");
  }
  const githubTokenForTflintInit =
    input.githubTokenForTflintInit || input.githubToken;
  const githubTokenForFix = input.githubTokenForFix || input.githubToken;
  const executor = input.executor;
  const eventName = input.eventName ?? github.context.eventName;
  const logger = input.logger ?? {
    info: core.info,
    error: core.error,
    setOutput: core.setOutput,
    writeSummary: async (content: string) => {
      core.summary.addRaw(content);
      await core.summary.write();
    },
  };
  const createCommit = input.createCommit ?? defaultCreateCommit;
  const checkGitDiff = input.checkGitDiff ?? defaultCheckGitDiff;

  await executor.exec("tflint", ["--init"], {
    cwd: input.workingDirectory,
    group: "tflint --init",
    env: {
      GITHUB_TOKEN: githubTokenForTflintInit,
    },
  });

  const commonArgs: string[] = [];

  const help = await executor.getExecOutput("tflint", ["--help"], {
    cwd: input.workingDirectory,
    silent: true,
  });
  if (help.stdout.includes("--call-module-type")) {
    commonArgs.push("--call-module-type=all");
  } else {
    commonArgs.push("--module");
  }

  const sarifArgs = ["--format", "sarif", ...commonArgs];
  if (input.fix) {
    sarifArgs.push("--fix");
  }

  const out = await executor.getExecOutput("tflint", sarifArgs, {
    cwd: input.workingDirectory,
    group: "tflint",
    ignoreReturnCode: true,
  });
  if (input.fix) {
    const files = listFiles(
      out.stdout,
      path.relative(input.gitRootDir, input.workingDirectory),
    );
    if (files.size == 0) {
      return;
    }
    const { changedFiles } = await checkGitDiff([...files], input.gitRootDir);
    if (changedFiles.length !== 0) {
      logger.setOutput("fixed_files", changedFiles.join("\n"));
      await createCommit({
        commitMessage: "fix(tflint): auto fix",
        githubToken: githubTokenForFix,
        files: new Set(changedFiles),
        serverRepository: input.serverRepository,
        appId: input.csmAppId,
        appPrivateKey: input.csmAppPrivateKey,
      });
      throw new Error("code is fixed by tflint --fix");
    }
  }

  if (out.exitCode !== 0) {
    logger.error("tflint failed");
    let combined = "";
    await executor.exec("tflint", commonArgs, {
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
      await logger.writeSummary(`## tflint\n\n\`\`\`\n${body}\n\`\`\`\n`);
    }
  }

  const filterMode = input.tflint?.reviewdog?.filter_mode ?? "nofilter";

  const reporter =
    eventName == "pull_request" ? "github-pr-review" : "github-check";

  core.startGroup("reviewdog input");
  logger.info(out.stdout);
  core.endGroup();

  const reviewdogArgs = [
    "-f",
    "sarif",
    "-name",
    "tflint",
    "-filter-mode",
    filterMode,
    "-reporter",
    reporter,
    "-level",
    "warning",
  ];
  const failLevel = input.tflint?.reviewdog?.fail_level ?? "any";
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
    group: "reviewdog",
    env: {
      REVIEWDOG_GITHUB_API_TOKEN: input.githubToken,
    },
  });
};
