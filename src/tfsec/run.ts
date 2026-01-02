import * as exec from "@actions/exec";
import * as core from "@actions/core";
import * as github from "@actions/github";
import * as path from "path";
import * as lib from "../lib";

type Inputs = {
  workingDirectory: string;
  githubToken: string;
  githubComment: boolean;
  ignoreHCLErrors: boolean;
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

function generateTable(
  diagnostics: Array<Diagnostic>,
  basePath: string,
): string {
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

    let locPath = diagnostic.location.path;
    if (path.isAbsolute(diagnostic.location.path)) {
      locPath = path.relative(basePath, diagnostic.location.path);
    }

    lines.push(
      `${rule} | ${diagnostic.severity} | ${locPath} | ${range} | ${diagnostic.message}`,
    );
  }
  return lines.join("\n");
}

function getSeverity(s: string): string {
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
}

function getURL(result: any): string {
  if (result.links && result.links.length != 0) {
    return result.links[0];
  }
  return "";
}

function trimTrivyMessage(stdout: string): string {
  if (!stdout.startsWith("=")) {
    return stdout;
  }
  const lines = stdout.split("\n").slice(1);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("=")) {
      return lines.slice(i + 1).join("\n");
    }
  }
  return lines.join("\n");
}

export const run = async (inputs: Inputs): Promise<void> => {
  core.info("Running tfsec");
  const args = ["--format", "json", "."];
  if (inputs.ignoreHCLErrors) {
    args.push("--ignore-hcl-errors");
  }
  const out = await exec.getExecOutput("tfsec", args, {
    cwd: inputs.workingDirectory,
    ignoreReturnCode: true,
    env: {
      ...process.env,
      AQUA_GLOBAL_CONFIG: lib.AquaConfig,
    },
  });
  core.info("Parsing tfsec result");

  // https://github.com/suzuki-shunsuke/github-action-tfsec/issues/618
  const stdout = trimTrivyMessage(out.stdout.trim());

  const outJSON = JSON.parse(stdout);
  if (outJSON.results == null) {
    core.info("tfsec results is null");
    return;
  }
  const diagnostics = new Array<Diagnostic>();
  for (let i = 0; i < outJSON.results.length; i++) {
    const result = outJSON.results[i];
    diagnostics.push({
      message: result.description,
      code: {
        value: result.long_id ? result.long_id : result.rule_id,
        url: getURL(result),
      },
      location: {
        path: result.location.filename,
        range: {
          start: {
            line: result.location.start_line,
          },
          end: {
            line: result.location.end_line,
          },
        },
      },
      severity: getSeverity(result.severity),
    });
  }

  if (inputs.githubComment && diagnostics.length > 0) {
    const table = generateTable(diagnostics, inputs.workingDirectory);
    const githubCommentTemplate = `## :x: tfsec error

{{template "link" .}} | [tfsec](https://aquasecurity.github.io/tfsec) | [Ignoring Checks](https://aquasecurity.github.io/tfsec/latest/guides/configuration/ignores/) | [tfsec Config](https://aquasecurity.github.io/tfsec/latest/guides/configuration/config/)

Working Directory: \`${inputs.workingDirectory}\`

${table}`;
    await exec.exec("github-comment", ["post", "-stdin-template"], {
      input: Buffer.from(githubCommentTemplate),
      env: {
        ...process.env,
        GITHUB_TOKEN: inputs.githubToken,
        GH_COMMENT_CONFIG: lib.GitHubCommentConfig,
        AQUA_GLOBAL_CONFIG: lib.AquaConfig,
      },
    });
  }

  const reporter =
    github.context.eventName == "pull_request"
      ? "github-pr-review"
      : "github-check";
  core.info("Running reviewdog");
  await exec.exec(
    "reviewdog",
    [
      "-f",
      "rdjson",
      "-name",
      "tfsec",
      "-filter-mode",
      "nofilter",
      "-reporter",
      reporter,
      "-level",
      "warning",
      "-fail-on-error",
      "1",
    ],
    {
      input: Buffer.from(
        JSON.stringify({
          source: {
            name: "tfsec",
            url: "https://github.com/aquasecurity/tfsec",
          },
          diagnostics: diagnostics,
        }),
      ),
      env: {
        ...process.env,
        REVIEWDOG_GITHUB_API_TOKEN: inputs.githubToken,
        AQUA_GLOBAL_CONFIG: lib.AquaConfig,
      },
    },
  );
  if (out.exitCode != 0) {
    throw "tfsec failed";
  }
};
