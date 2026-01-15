import * as core from "@actions/core";
import * as github from "@actions/github";
import * as path from "path";
import * as lib from "../lib";
import * as aqua from "../aqua";

type Inputs = {
  workingDirectory: string;
  githubToken: string;
  configPath: string;
  executor: aqua.Executor;
};

class DiagnosticCode {
  value = "";
  url = "";
}

class DiagnosticLocation {
  path = "";
  range = new DiagnosticLocationRange();
}

class DiagnosticLocationRange {
  start = new DiagnosticLocationRangePoint();
  end = new DiagnosticLocationRangePoint();
}

class DiagnosticLocationRangePoint {
  line = 0;
}

class Diagnostic {
  message = "";
  code = new DiagnosticCode();
  location = new DiagnosticLocation();
  severity = "";
}

const generateTable = (
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

const getSeverity = (s: string): string => {
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

export const run = async (inputs: Inputs): Promise<void> => {
  const args = inputs.configPath
    ? ["config", "--format", "json", "--config", inputs.configPath, "."]
    : ["config", "--format", "json", "."];
  const executor = inputs.executor;
  core.startGroup("trivy");
  const out = await executor.getExecOutput("trivy", args, {
    cwd: inputs.workingDirectory,
    ignoreReturnCode: true,
  });
  core.endGroup();
  core.info("Parsing trivy config result");
  const outJSON = JSON.parse(out.stdout);
  if (outJSON.Results == null) {
    core.info("trivy config is null");
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

  const config = await lib.getConfig();
  const filterMode = config.trivy?.reviewdog?.filter_mode ?? "nofilter";

  if (filterMode === "nofilter" && diagnostics.length > 0) {
    const table = generateTable(diagnostics, inputs.workingDirectory);
    const githubCommentTemplate = `## :x: Trivy error

{{template "link" .}} | [trivy](https://aquasecurity.github.io/trivy)

Working Directory: \`${inputs.workingDirectory}\`

${table}`;
    await executor.exec("github-comment", ["post", "-stdin-template"], {
      input: Buffer.from(githubCommentTemplate),
      env: {
        GITHUB_TOKEN: inputs.githubToken,
        GH_COMMENT_CONFIG: lib.GitHubCommentConfig,
      },
    });
  }

  const reporter =
    github.context.eventName == "pull_request"
      ? "github-pr-review"
      : "github-check";

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
  const failLevel = config.trivy?.reviewdog?.fail_level ?? "any";
  const reviewdogHelp = await executor.getExecOutput("reviewdog", ["--help"], {
    cwd: inputs.workingDirectory,
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

  core.startGroup("reviewdog -name trivy");
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
    cwd: inputs.workingDirectory,
    env: {
      REVIEWDOG_GITHUB_API_TOKEN: inputs.githubToken,
    },
  });
  core.endGroup();
  if (out.exitCode != 0) {
    throw new Error("trivy failed");
  }
};
