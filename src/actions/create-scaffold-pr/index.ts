import * as core from "@actions/core";
import Handlebars from "handlebars";

import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import * as git from "../../lib/git";
import * as aqua from "../../aqua";
import * as getTargetConfig from "../get-target-config";
import * as commit from "../../commit";

const generateBranchName = (target: string): string => {
  const now = new Date();
  const timestamp =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0") +
    "T" +
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0") +
    now.getSeconds().toString().padStart(2, "0");
  return `scaffold-working-directory-${target}-${timestamp}`.replaceAll(
    "/",
    "__",
  );
};

const writeSkipCreatePrSummary = (
  repository: string,
  branch: string,
  target: string,
  draftPr: boolean,
): void => {
  let draftOpt = "";
  if (draftPr) {
    draftOpt = "-d ";
  }

  const summary = `
## Create a scaffold pull request

Please run the following command in your terminal.

\`\`\`
gh pr create -R "${repository}" ${draftOpt}\\
  -H "${branch}" \\
  -t "Scaffold a working directory (${target})" \\
  -b "This pull request was created by [GitHub Actions](${env.runURL})"
\`\`\`

[Reference](https://suzuki-shunsuke.github.io/tfaction/docs/feature/skip-creating-pr)
`;

  core.summary.addRaw(summary);
  core.summary.write();
};

export const main = async () => {
  const githubToken = input.githubToken;
  const securefixAppId = input.securefixActionAppId;
  const securefixAppPrivateKey = input.securefixActionAppPrivateKey;

  const config = await lib.getConfig();

  const skipCreatePr = config.skip_create_pr;
  const draftPr = config.draft_pr;
  const securefixServerRepository =
    config.securefix_action?.server_repository ?? "";
  const securefixPRBaseBranch =
    config.securefix_action?.pull_request?.base_branch ?? "";

  // Get target config
  const targetConfigResult = await getTargetConfig.getTargetConfig(
    {
      target: env.all.TFACTION_TARGET,
      workingDir: env.all.TFACTION_WORKING_DIR,
      isApply: false,
      jobType: "scaffold_working_dir",
    },
    config,
  );

  const workingDir =
    targetConfigResult.working_directory || env.all.TFACTION_WORKING_DIR;
  const target = targetConfigResult.target || env.all.TFACTION_TARGET;

  if (!target) {
    throw new Error("TFACTION_TARGET is required");
  }

  await aqua.NewExecutor({
    cwd: workingDir,
    githubToken,
  });

  // Generate branch name
  const branch = generateBranchName(target);
  core.info(`Generated branch name: ${branch}`);

  // Get modified files
  const files = await git.getModifiedFiles(workingDir);
  core.info(`Found ${files.length} modified files`);
  if (files.length === 0) {
    core.info("No files to commit");
    return;
  }

  const actor = env.all.GITHUB_ACTOR;

  const vars = {
    target: target,
    working_dir: workingDir,
    actor,
    run_url: env.runURL,
  };
  const commitMessage = `scaffold a working directory (${target})`;

  const prTitle = config?.scaffold_working_directory?.pull_request?.title
    ? Handlebars.compile(
        config?.scaffold_working_directory?.pull_request?.title,
      )(vars)
    : `Scaffold a working directory (${target})`;

  const prBody = config?.scaffold_working_directory?.pull_request?.body
    ? Handlebars.compile(
        config?.scaffold_working_directory?.pull_request?.body,
      )(vars)
    : `This pull request scaffolds a working directory \`${workingDir}\`.
    [@${actor} created this pull request by GitHub Actions](${env.runURL}).`;

  const prComment = config?.scaffold_working_directory?.pull_request?.comment
    ? Handlebars.compile(
        config?.scaffold_working_directory?.pull_request?.comment,
      )(vars)
    : `@${actor} This pull request was created by [GitHub Actions](${env.runURL}) you ran.
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
    writeSkipCreatePrSummary(env.all.GITHUB_REPOSITORY, branch, target, draftPr);
  }
};
