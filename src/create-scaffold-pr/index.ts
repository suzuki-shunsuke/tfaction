import * as core from "@actions/core";

import * as lib from "../lib";
import * as env from "../lib/env";
import * as input from "../lib/input";
import * as git from "../lib/git";
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

const writeSkipCreatePrSummary = (
  repository: string,
  branch: string,
  target: string,
  draftPr: boolean,
): void => {
  const serverUrl = env.githubServerUrl || "https://github.com";
  const runId = env.githubRunId;
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
  const files = await git.getModifiedFiles(workingDir);
  core.info(`Found ${files.length} modified files`);
  if (files.length === 0) {
    core.info("No files to commit");
    return;
  }

  const serverUrl = env.githubServerUrl || "https://github.com";
  const repository = env.githubRepository;
  const runId = env.githubRunId;
  const actor = env.githubActor;
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
