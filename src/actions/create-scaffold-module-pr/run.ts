import * as core from "@actions/core";
import Handlebars from "handlebars";

import * as lib from "../../lib";
import * as git from "../../lib/git";
import * as aqua from "../../aqua";
import * as commit from "../../commit";

export const generateBranchName = (modulePath: string): string => {
  const now = new Date();
  const timestamp =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0") +
    "T" +
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0") +
    now.getSeconds().toString().padStart(2, "0");
  return `scaffold-module-${modulePath}-${timestamp}`.replaceAll("/", "__");
};

export const writeSkipCreatePrSummary = (
  repository: string,
  branch: string,
  modulePath: string,
  draftPr: boolean,
  runURL: string,
): void => {
  let draftOpt = "";
  if (draftPr) {
    draftOpt = "-d ";
  }

  const summary = `
## Create a pull request

Please run the following command in your terminal.

\`\`\`
gh pr create -R "${repository}" ${draftOpt}\\
  -H "${branch}" \\
  -t "Scaffold a Terraform Module (${modulePath})" \\
  -b "This pull request was created by [GitHub Actions](${runURL})"
\`\`\`

[Reference](https://suzuki-shunsuke.github.io/tfaction/docs/feature/skip-creating-pr)
`;

  core.summary.addRaw(summary);
  core.summary.write();
};

export interface RunInput {
  githubToken: string;
  securefixAppId: string;
  securefixAppPrivateKey: string;
  modulePath: string;
  actor: string;
  repository: string;
  runURL: string;
}

export const run = async (input: RunInput): Promise<void> => {
  const {
    githubToken,
    securefixAppId,
    securefixAppPrivateKey,
    modulePath,
    actor,
    repository,
    runURL,
  } = input;

  // Input validation
  if (!githubToken && (!securefixAppId || !securefixAppPrivateKey)) {
    throw new Error(
      "github_token or a pair of securefix_action_app_id and securefix_action_app_private_key is required",
    );
  }

  if (!modulePath) {
    throw new Error("env.TFACTION_MODULE_PATH is required");
  }

  const config = await lib.getConfig();

  const skipCreatePr = config.skip_create_pr;
  const draftPr = config.draft_pr;
  const securefixServerRepository =
    config.securefix_action?.server_repository ?? "";
  const securefixPRBaseBranch =
    config.securefix_action?.pull_request?.base_branch ?? "";

  await aqua.NewExecutor({
    githubToken,
    cwd: modulePath,
  });

  // Generate branch name
  const branch = generateBranchName(modulePath);
  core.info(`Generated branch name: ${branch}`);

  // Get modified files
  const files = await git.getModifiedFiles(modulePath);
  core.info(`Found ${files.length} modified files`);
  if (files.length === 0) {
    core.info("No files to commit");
    return;
  }

  const commitMessage = `chore(${modulePath}): scaffold a Terraform Module`;

  const vars = {
    module_path: modulePath,
    actor,
    run_url: runURL,
  };

  const prTitle = config?.scaffold_module?.pull_request?.title
    ? Handlebars.compile(config?.scaffold_module?.pull_request?.title)(vars)
    : `Scaffold a Terraform Module (${modulePath})`;

  const prBody = config?.scaffold_module?.pull_request?.body
    ? Handlebars.compile(config?.scaffold_module?.pull_request?.body)(vars)
    : `This pull request was created by [GitHub Actions](${runURL})`;

  const prComment = config?.scaffold_module?.pull_request?.comment
    ? Handlebars.compile(config?.scaffold_module?.pull_request?.comment)(vars)
    : `@${actor} This pull request was created by [GitHub Actions](${runURL}) you ran.
    Please handle this pull request.`;

  await commit.create({
    commitMessage,
    githubToken,
    files: new Set(files),
    serverRepository: securefixServerRepository,
    appId: securefixAppId,
    appPrivateKey: securefixAppPrivateKey,
    branch,
    pr: skipCreatePr
      ? undefined
      : {
          title: prTitle,
          body: prBody,
          base: securefixPRBaseBranch,
          assignees: actor ? [actor] : undefined,
          draft: draftPr,
          comment: prComment,
        },
  });

  // Write step summary if skip_create_pr is true
  if (skipCreatePr) {
    writeSkipCreatePrSummary(repository, branch, modulePath, draftPr, runURL);
  }
};
