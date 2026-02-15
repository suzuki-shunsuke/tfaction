import * as core from "@actions/core";
import * as github from "@actions/github";
import * as path from "path";
import { z } from "zod";
import * as aqua from "../../../aqua";
import * as types from "../../../lib/types";
import { checkGitDiff as defaultCheckGitDiff } from "../../../lib/git";
import { create as defaultCreateCommit } from "../../../commit";

export type Logger = {
  info: (message: string) => void;
  setOutput: (name: string, value: string) => void;
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
  securefixActionAppId: string;
  securefixActionAppPrivateKey: string;
  tflint?: types.TflintConfig;
  eventName?: string;
  logger?: Logger;
  githubCommentConfig?: string;
  createCommit?: CommitCreator;
  checkGitDiff?: GitDiffChecker;
};

// .runs[].results[].locations[].physicalLocation.artifactLocation.uri
const TflintOutput = z.object({
  runs: z
    .object({
      results: z
        .object({
          locations: z
            .object({
              physicalLocation: z.object({
                artifactLocation: z.object({
                  uri: z.string(),
                }),
              }),
            })
            .array(),
        })
        .array(),
    })
    .array(),
});
type TflintOutput = z.infer<typeof TflintOutput>;

export const run = async (input: RunInput): Promise<void> => {
  if (!input.githubToken) {
    throw new Error("github_token is required");
  }
  const githubTokenForTflintInit =
    input.githubTokenForTflintInit || input.githubToken;
  const githubTokenForFix = input.githubTokenForFix || input.githubToken;
  const executor = input.executor;
  const eventName = input.eventName ?? github.context.eventName;
  const logger = input.logger ?? { info: core.info, setOutput: core.setOutput };
  const createCommit = input.createCommit ?? defaultCreateCommit;
  const checkGitDiff = input.checkGitDiff ?? defaultCheckGitDiff;

  await executor.exec("tflint", ["--init"], {
    cwd: input.workingDirectory,
    group: "tflint --init",
    env: {
      GITHUB_TOKEN: githubTokenForTflintInit,
    },
  });

  const args = ["--format", "sarif"];

  const help = await executor.getExecOutput("tflint", ["--help"], {
    cwd: input.workingDirectory,
    silent: true,
  });
  if (help.stdout.includes("--call-module-type")) {
    args.push("--call-module-type=all");
  } else {
    args.push("--module");
  }
  if (input.fix) {
    args.push("--fix");
  }

  const out = await executor.getExecOutput("tflint", args, {
    cwd: input.workingDirectory,
    group: "tflint",
    ignoreReturnCode: true,
  });
  const outJSON = TflintOutput.parse(JSON.parse(out.stdout));
  if (input.fix) {
    const files = new Set<string>();
    for (const run of outJSON.runs) {
      for (const result of run.results) {
        for (const location of result.locations) {
          files.add(
            path.relative(
              input.gitRootDir,
              path.join(
                input.workingDirectory,
                location.physicalLocation.artifactLocation.uri,
              ),
            ),
          );
        }
      }
    }
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
        appId: input.securefixActionAppId,
        appPrivateKey: input.securefixActionAppPrivateKey,
      });
      throw new Error("code is fixed by tflint --fix");
    }
  }

  const filterMode = input.tflint?.reviewdog?.filter_mode ?? "nofilter";

  const reporter =
    eventName == "pull_request" ? "github-pr-review" : "github-check";
  logger.info(`Reviewdog input: ${out.stdout}`);

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
