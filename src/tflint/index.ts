import * as path from "path";
import * as aqua from "../aqua";
import * as types from "../lib/types";

export type DiagnosticCode = {
  value: string;
  url: string;
};

export type DiagnosticLocationRangePoint = {
  line: number;
};

export type DiagnosticLocationRange = {
  start: DiagnosticLocationRangePoint;
  end: DiagnosticLocationRangePoint;
};

export type DiagnosticLocation = {
  path: string;
  range: DiagnosticLocationRange;
};

export type Diagnostic = {
  message: string;
  code: DiagnosticCode;
  location: DiagnosticLocation;
  severity: string;
};

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
) => Promise<{ changedFiles: string[] }>;

export type RunInput = {
  executor: aqua.Executor;
  workingDirectory: string;
  githubToken: string;
  githubTokenForTflintInit: string;
  githubTokenForFix: string;
  fix: boolean;
  serverRepository: string;
  securefixActionAppId: string;
  securefixActionAppPrivateKey: string;
  tflint?: types.TflintConfig;
  eventName: string;
  logger: Logger;
  githubCommentConfig: string;
  createCommit: CommitCreator;
  checkGitDiff: GitDiffChecker;
};

export const getSeverity = (s: string): string => {
  if (s == "error") {
    return "ERROR";
  }
  if (s == "warning") {
    return "WARNING";
  }
  if (s == "info") {
    return "INFO";
  }
  return "";
};

export const generateTable = (diagnostics: Array<Diagnostic>): string => {
  const lines: Array<string> = [
    "rule | severity | filepath | range | message",
    "--- | --- | --- | --- | ---",
  ];
  for (let i = 0; i < diagnostics.length; i++) {
    const diagnostic = diagnostics[i];

    let rule = diagnostic.code.value;
    if (diagnostic.code.url) {
      rule = `[${diagnostic.code.value}](${diagnostic.code.url})`;
    }

    let range = "";
    if (
      diagnostic.location &&
      diagnostic.location.range &&
      diagnostic.location.range.start
    ) {
      range = `${diagnostic.location.range.start.line} ... ${diagnostic.location.range.end.line}`;
    }

    lines.push(
      `${rule} | ${diagnostic.severity} | ${diagnostic.location.path} | ${range} | ${diagnostic.message}`,
    );
  }
  return lines.join("\n");
};

type TflintIssue = {
  message: string;
  rule: {
    name: string;
    link: string;
    severity: string;
  };
  range: {
    filename: string;
    start: { line: number };
    end: { line: number };
  };
};

type TflintError = {
  message: string;
  severity: string;
  range: {
    filename: string;
    start: { line: number };
    end: { line: number };
  };
};

type TflintOutput = {
  issues?: TflintIssue[];
  errors?: TflintError[];
};

export const run = async (input: RunInput): Promise<void> => {
  if (!input.githubToken) {
    throw new Error("github_token is required");
  }
  const githubTokenForTflintInit =
    input.githubTokenForTflintInit || input.githubToken;
  const githubTokenForFix = input.githubTokenForFix || input.githubToken;
  const executor = input.executor;

  await executor.exec("tflint", ["--init"], {
    cwd: input.workingDirectory,
    group: "tflint --init",
    env: {
      GITHUB_TOKEN: githubTokenForTflintInit,
    },
  });

  const args = ["--format", "json"];

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
  const outJSON: TflintOutput = JSON.parse(out.stdout);
  const diagnostics = new Array<Diagnostic>();
  if (outJSON.issues) {
    for (let i = 0; i < outJSON.issues.length; i++) {
      const issue = outJSON.issues[i];
      diagnostics.push({
        message: issue.message,
        code: {
          value: issue.rule.name,
          url: issue.rule.link,
        },
        location: {
          path: issue.range.filename,
          range: {
            start: {
              line: issue.range.start.line,
            },
            end: {
              line: issue.range.end.line,
            },
          },
        },
        severity: getSeverity(issue.rule.severity),
      });
    }
  }
  if (outJSON.errors) {
    for (let i = 0; i < outJSON.errors.length; i++) {
      const err = outJSON.errors[i];
      diagnostics.push({
        message: err.message,
        code: {
          value: "",
          url: "",
        },
        location: {
          path: err.range.filename,
          range: {
            start: {
              line: err.range.start.line,
            },
            end: {
              line: err.range.end.line,
            },
          },
        },
        severity: getSeverity(err.severity),
      });
    }
  }
  if (input.fix) {
    const files = new Set(
      diagnostics.map((d) =>
        path.join(input.workingDirectory, d.location.path),
      ),
    );
    if (files.size == 0) {
      return;
    }
    const { changedFiles } = await input.checkGitDiff([...files]);
    if (changedFiles.length !== 0) {
      input.logger.setOutput("fixed_files", changedFiles.join("\n"));
      await input.createCommit({
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

  if (filterMode === "nofilter" && diagnostics.length > 0) {
    const table = generateTable(diagnostics);
    const githubCommentTemplate = `## :x: tflint error

{{template "link" .}} | [tflint](https://github.com/terraform-linters/tflint) | [tflint Annotations to disable rules](https://github.com/terraform-linters/tflint/blob/master/docs/user-guide/annotations.md) | [tflint Config](https://github.com/terraform-linters/tflint/blob/master/docs/user-guide/config.md)

Working Directory: \`${input.workingDirectory}\`

${table}`;
    await executor.exec("github-comment", ["post", "-stdin-template"], {
      input: Buffer.from(githubCommentTemplate),
      env: {
        GITHUB_TOKEN: input.githubToken,
        GH_COMMENT_CONFIG: input.githubCommentConfig,
      },
    });
  }

  const reviewDogInput = JSON.stringify({
    source: {
      name: "tflint",
      url: "https://github.com/terraform-linters/tflint",
    },
    diagnostics: diagnostics,
  });
  const reporter =
    input.eventName == "pull_request" ? "github-pr-review" : "github-check";
  input.logger.info(`Reviewdog input: ${reviewDogInput}`);
  input.logger.info("Running reviewdog");

  const reviewdogArgs = [
    "-f",
    "rdjson",
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
    input: Buffer.from(reviewDogInput),
    cwd: input.workingDirectory,
    group: "reviewdog",
    env: {
      REVIEWDOG_GITHUB_API_TOKEN: input.githubToken,
    },
  });
};
