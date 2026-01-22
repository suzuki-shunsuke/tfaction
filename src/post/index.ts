import * as fs from "fs";
import * as path from "path";
import * as github from "@actions/github";
import * as yaml from "js-yaml";
import Handlebars from "handlebars";

import * as env from "../lib/env";
import * as lib from "../lib";

export type Inputs = {
  octokit: ReturnType<typeof github.getOctokit>;
  prNumber: number;
  templateKey: string;
  vars: Record<string, string>;
};

type Metadata = {
  JobName: string;
  SHA1: string;
  TemplateKey: string;
  Vars: Record<string, string>;
};

type CommentConfig = {
  post: Record<string, { template: string }>;
};

const loadConfig = (): CommentConfig => {
  const configPath = path.join(lib.GitHubActionPath, "install", "comment.yaml");
  const content = fs.readFileSync(configPath, "utf8");
  return yaml.load(content) as CommentConfig;
};

const block = "```";

const registerHelpers = () => {
  Handlebars.registerHelper("link", () => {
    return `[Build link](${env.githubServerUrl}/${env.githubRepository}/actions/runs/${env.githubRunId})`;
  });

  Handlebars.registerHelper(
    "join_command",
    function (this: { JoinCommand?: string }) {
      return `
${block}
${this.JoinCommand ?? ""}
${block}
`;
    },
  );

  Handlebars.registerHelper(
    "hidden_combined_output",
    function (this: { CombinedOutput?: string }) {
      return `
<details>

${block}
${this.CombinedOutput ?? ""}
${block}

</details>
`;
    },
  );

  Handlebars.registerHelper("status", function (this: { ExitCode?: number }) {
    return this.ExitCode === 0 ? ":white_check_mark:" : ":x:";
  });
};

export const post = async (inputs: Inputs): Promise<void> => {
  const config = loadConfig();
  registerHelpers();

  const templateConfig = config.post[inputs.templateKey];
  if (!templateConfig) {
    throw new Error(`Template not found: ${inputs.templateKey}`);
  }

  const template = Handlebars.compile(templateConfig.template);
  const message = template({ Vars: inputs.vars });

  const metadata: Metadata = {
    JobName: env.githubJob,
    SHA1: env.githubSha,
    TemplateKey: inputs.templateKey,
    Vars: inputs.vars,
  };

  const body = `${message}
<!-- github-comment: ${JSON.stringify(metadata)} -->
`;

  await inputs.octokit.rest.issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: inputs.prNumber,
    body,
  });
};
