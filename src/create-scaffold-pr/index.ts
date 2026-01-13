import * as core from "@actions/core";
import * as exec from "@actions/exec";

import * as lib from "../lib";
import * as aqua from "../aqua";
import * as getTargetConfig from "../get-target-config";
import * as commit from "../commit";

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
  return `scaffold-working-directory-${target}-${timestamp}`;
};

const getModifiedFiles = async (workingDir: string): Promise<string[]> => {
  let output = "";
  await exec.exec(
    "git",
    ["ls-files", "--modified", "--others", "--exclude-standard", workingDir],
    {
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
      },
    },
  );
  return output
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
};

const writeSkipCreatePrSummary = (
  repository: string,
  branch: string,
  target: string,
  draftPr: boolean,
): void => {
  const serverUrl = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const runId = process.env.GITHUB_RUN_ID ?? "";
  const runUrl = `${serverUrl}/${repository}/actions/runs/${runId}`;

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
  -b "This pull request was created by [GitHub Actions](${runUrl})"
\`\`\`

[Reference](https://suzuki-shunsuke.github.io/tfaction/docs/feature/skip-creating-pr)
`;

  core.summary.addRaw(summary);
  core.summary.write();
};

export const main = async () => {
  const githubToken = core.getInput("github_token") || "";
  const securefixAppId = core.getInput("securefix_action_app_id") || "";
  const securefixAppPrivateKey =
    core.getInput("securefix_action_app_private_key") || "";

  const config = lib.getConfig();

  const skipCreatePr = config.skip_create_pr;
  const draftPr = config.draft_pr;
  const securefixServerRepository =
    config.securefix_action?.server_repository ?? "";
  const securefixPRBaseBranch =
    config.securefix_action?.pull_request?.base_branch ?? "";

  // Get target config
  const targetConfigResult = await getTargetConfig.getTargetConfig(
    {
      target: lib.getTargetFromEnv(),
      workingDir: lib.getWorkingDirFromEnv(),
      isApply: false,
      jobType: "scaffold_working_dir",
    },
    config,
  );

  const workingDir =
    targetConfigResult.working_directory || lib.getWorkingDirFromEnv() || "";
  const target = targetConfigResult.target || lib.getTargetFromEnv() || "";

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
  const files = await getModifiedFiles(workingDir);
  core.info(`Found ${files.length} modified files`);
  if (files.length === 0) {
    core.info("No files to commit");
    return;
  }

  const serverUrl = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const repository = process.env.GITHUB_REPOSITORY ?? "";
  const runId = process.env.GITHUB_RUN_ID ?? "";
  const actor = process.env.GITHUB_ACTOR ?? "";
  const runUrl = `${serverUrl}/${repository}/actions/runs/${runId}`;

  const commitMessage = `scaffold a working directory (${target})`;
  const prTitle = `Scaffold a working directory (${target})`;
  const prBody = `This pull request scaffolds a working directory \`${workingDir}\`.
[@${actor} created this pull request by GitHub Actions](${runUrl}).`;
  const prComment = `@${actor} This pull request was created by [GitHub Actions](${runUrl}) you ran.
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
    writeSkipCreatePrSummary(repository, branch, target, draftPr);
  }
};
