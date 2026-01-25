import * as path from "path";
import * as aqua from "../aqua";
import type { Config } from "../lib/types";

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
};

export type RunInput = {
  executor: aqua.Executor;
  workingDirectory: string;
  githubToken: string;
  configPath: string;
  config: Config;
  eventName: string;
  logger: Logger;
  githubCommentConfig: string;
};

export const getSeverity = (s: string): string => {
  if (s.startsWith("HIGH") || s.startsWith("CRITICAL")) {
    return "ERROR";
  }
  if (s.startsWith("MEDIUM")) {
    return "WARNING";
  }
  if (s.startsWith("LOW")) {
    return "INFO";
  }
  return "";
};

export const generateTable = (
  diagnostics: Array<Diagnostic>,
  basePath: string,
): string => {
  const lines: Array<string> = [
    "rule | severity | filepath | range | message",
    "--- | --- | --- | --- | ---",
  ];
  for (const diagnostic of diagnostics) {
    const rule = diagnostic.code.url
      ? `[${diagnostic.code.value}](${diagnostic.code.url})`
      : diagnostic.code.value;
    const range = diagnostic?.location?.range?.start
      ? `${diagnostic.location.range.start.line} ... ${diagnostic.location.range.end.line}`
      : "";
    const locPath = path.isAbsolute(diagnostic.location.path)
      ? path.relative(basePath, diagnostic.location.path)
      : diagnostic.location.path;
    lines.push(
      `${rule} | ${diagnostic.severity} | ${locPath} | ${range} | ${diagnostic.message}`,
    );
  }
  return lines.join("\n");
};

type TrivyMisconfiguration = {
  ID: string;
  Message: string;
  PrimaryURL: string;
  Severity: string;
  CauseMetadata: {
    StartLine: number;
    EndLine: number;
  };
};

type TrivyResult = {
  Target: string;
  Misconfigurations?: TrivyMisconfiguration[];
};

type TrivyOutput = {
  Results?: TrivyResult[];
};

export const run = async (input: RunInput): Promise<void> => {
  const args = input.configPath
    ? ["config", "--format", "json", "--config", input.configPath, "."]
    : ["config", "--format", "json", "."];
  const executor = input.executor;
  const out = await executor.getExecOutput("trivy", args, {
    cwd: input.workingDirectory,
    ignoreReturnCode: true,
    group: "trivy",
  });
  input.logger.info("Parsing trivy config result");
  const outJSON: TrivyOutput = JSON.parse(out.stdout);
  if (outJSON.Results == null) {
    input.logger.info("trivy config is null");
    return;
  }
  const diagnostics = new Array<Diagnostic>();
  for (const result of outJSON.Results) {
    if (result.Misconfigurations == null) {
      continue;
    }
    for (const misconfig of result.Misconfigurations) {
      diagnostics.push({
        message: misconfig.Message,
        code: {
          value: misconfig.ID,
          url: misconfig.PrimaryURL,
        },
        location: {
          path: result.Target,
          range: {
            start: {
              line: misconfig.CauseMetadata.StartLine,
            },
            end: {
              line: misconfig.CauseMetadata.EndLine,
            },
          },
        },
        severity: getSeverity(misconfig.Severity),
      });
    }
  }

  const filterMode = input.config.trivy?.reviewdog?.filter_mode ?? "nofilter";

  if (filterMode === "nofilter" && diagnostics.length > 0) {
    const table = generateTable(diagnostics, input.workingDirectory);
    const githubCommentTemplate = `## :x: Trivy error

{{template "link" .}} | [trivy](https://aquasecurity.github.io/trivy)

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

  const reporter =
    input.eventName == "pull_request" ? "github-pr-review" : "github-check";

  const reviewdogArgs = [
    "-f",
    "rdjson",
    "-name",
    "trivy",
    "-filter-mode",
    filterMode,
    "-reporter",
    reporter,
    "-level",
    "warning",
  ];
  const failLevel = input.config.trivy?.reviewdog?.fail_level ?? "any";
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
    input: Buffer.from(
      JSON.stringify({
        source: {
          name: "trivy",
          url: "https://github.com/aquasecurity/trivy",
        },
        diagnostics: diagnostics,
      }),
    ),
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
