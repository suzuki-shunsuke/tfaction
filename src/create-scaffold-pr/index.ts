import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as github from "@actions/github";
import * as securefix from "@csm-actions/securefix-action";
import * as commit from "@suzuki-shunsuke/commit-ts";

import * as lib from "../lib";
import * as getGlobalConfig from "../get-global-config";
import * as getTargetConfig from "../get-target-config";

type Octokit = ReturnType<typeof github.getOctokit>;

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

interface SecurefixParams {
  appId: string;
  privateKey: string;
  serverRepository: string;
  branch: string;
  files: string[];
  commitMessage: string;
  skipCreatePr: boolean;
  prTitle: string;
  prBody: string;
  baseBranch: string;
  assignee: string;
  draftPr: boolean;
  prComment: string;
}

const createViaSecurefix = async (params: SecurefixParams): Promise<void> => {
  const {
    appId,
    privateKey,
    serverRepository,
    branch,
    files,
    commitMessage,
    skipCreatePr,
    prTitle,
    prBody,
    baseBranch,
    assignee,
    draftPr,
    prComment,
  } = params;

  if (skipCreatePr) {
    await securefix.request({
      appId,
      privateKey,
      serverRepository,
      branch,
      files: new Set(files),
      commitMessage,
      workspace: process.env.GITHUB_WORKSPACE ?? "",
    });
    core.info("Created commit via securefix");
  } else {
    await securefix.request({
      appId,
      privateKey,
      serverRepository,
      branch,
      files: new Set(files),
      commitMessage,
      workspace: process.env.GITHUB_WORKSPACE ?? "",
      pr: {
        title: prTitle,
        body: prBody,
        base: baseBranch,
        assignees: assignee ? [assignee] : undefined,
        draft: draftPr,
        comment: prComment,
      },
    });
    core.info("Created PR via securefix");
  }
};

interface GitHubAPIParams {
  octokit: Octokit;
  branch: string;
  files: string[];
  commitMessage: string;
  skipCreatePr: boolean;
  prTitle: string;
  prBody: string;
  assignee: string;
  draftPr: boolean;
}

const createViaGitHubAPI = async (params: GitHubAPIParams): Promise<void> => {
  const {
    octokit,
    branch,
    files,
    commitMessage,
    skipCreatePr,
    prTitle,
    prBody,
    assignee,
    draftPr,
  } = params;

  await commit.createCommit(octokit, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    branch,
    message: commitMessage,
    files,
    deleteIfNotExist: true,
    logger: {
      info: core.info,
    },
  });
  core.info(`Created commit on branch ${branch}`);

  if (skipCreatePr) {
    return;
  }

  const { data: repoData } = await octokit.rest.repos.get({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
  });
  const baseBranch = repoData.default_branch;

  const { data: pr } = await octokit.rest.pulls.create({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    head: branch,
    base: baseBranch,
    title: prTitle,
    body: prBody,
    draft: draftPr,
  });

  core.info(`Created PR: ${pr.html_url}`);
  core.notice(`Scaffold working directory pull request: ${pr.html_url}`);

  if (assignee) {
    await octokit.rest.issues.addAssignees({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: pr.number,
      assignees: [assignee],
    });
    core.info(`Added assignee ${assignee} to PR #${pr.number}`);
  }
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

  // Get global config
  const config = lib.getConfig();
  const globalConfigResult = getGlobalConfig.main_(config, {});

  const skipCreatePr = globalConfigResult.outputs.skip_create_pr;
  const draftPr = globalConfigResult.outputs.draft_pr;
  const securefixServerRepository =
    globalConfigResult.outputs.securefix_action_server_repository;
  const securefixPRBaseBranch =
    globalConfigResult.outputs.securefix_action_pull_request_base_branch;

  // Get target config
  const targetConfigResult = await getTargetConfig.getTargetConfig(
    {
      target: process.env.TFACTION_TARGET,
      workingDir: process.env.TFACTION_WORKING_DIR,
      isApply: false,
      jobType: "scaffold_working_dir",
    },
    config,
  );

  const workingDir =
    targetConfigResult.working_directory ||
    process.env.TFACTION_WORKING_DIR ||
    "";
  const target = targetConfigResult.target || process.env.TFACTION_TARGET || "";

  if (!target) {
    throw new Error("TFACTION_TARGET is required");
  }

  // Run aqua i -l -a (install)
  core.info(`Installing dependencies with aqua in ${workingDir}`);
  await exec.exec("aqua", ["i", "-l", "-a"], {
    cwd: workingDir,
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

  if (securefixServerRepository) {
    if (!securefixAppId || !securefixAppPrivateKey) {
      throw new Error(
        "securefix_action_app_id and securefix_action_app_private_key are required when securefix_action_server_repository is set",
      );
    }

    await createViaSecurefix({
      appId: securefixAppId,
      privateKey: securefixAppPrivateKey,
      serverRepository: securefixServerRepository,
      branch,
      files,
      commitMessage,
      skipCreatePr,
      prTitle,
      prBody,
      baseBranch: securefixPRBaseBranch,
      assignee: actor,
      draftPr,
      prComment,
    });
  } else {
    if (!githubToken) {
      throw new Error(
        "github_token is required when securefix_action_server_repository is not set",
      );
    }

    const octokit = github.getOctokit(githubToken);

    await createViaGitHubAPI({
      octokit,
      branch,
      files,
      commitMessage,
      skipCreatePr,
      prTitle,
      prBody,
      assignee: actor,
      draftPr,
    });
  }

  // Write step summary if skip_create_pr is true
  if (skipCreatePr) {
    writeSkipCreatePrSummary(repository, branch, target, draftPr);
  }
};
