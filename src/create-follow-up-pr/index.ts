import * as core from "@actions/core";
import * as github from "@actions/github";
import * as securefix from "@csm-actions/securefix-action";
import * as commit from "@suzuki-shunsuke/commit-ts";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";

import * as lib from "../lib";
import * as aqua from "../aqua";
import * as getTargetConfig from "../get-target-config";

const PRData = z.object({
  body: z.string(),
  assignees: z
    .array(
      z.object({
        login: z.string(),
      }),
    )
    .optional(),
});

const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

type Octokit = ReturnType<typeof github.getOctokit>;

interface GroupLabelParams {
  octokit: Octokit;
  groupLabelEnabled: boolean;
  groupLabelPrefix: string;
  prNumber: string;
  tempDir: string;
}

const getOrCreateGroupLabel = async (
  params: GroupLabelParams,
): Promise<string> => {
  const { octokit, groupLabelEnabled, groupLabelPrefix, prNumber, tempDir } =
    params;

  if (!groupLabelEnabled || !tempDir) {
    return "";
  }

  const labelsFilePath = `${tempDir}/labels.txt`;
  let labels: string[] = [];
  if (fs.existsSync(labelsFilePath)) {
    const content = fs.readFileSync(labelsFilePath, "utf8");
    labels = content.split("\n").filter((l) => l.length > 0);
  }

  const groupLabelPattern = new RegExp(
    `${escapeRegExp(groupLabelPrefix)}[0-9]+`,
  );
  let groupLabel = labels.find((label) => groupLabelPattern.test(label)) || "";

  if (!groupLabel) {
    groupLabel = `${groupLabelPrefix}${prNumber}`;
    try {
      await octokit.rest.issues.createLabel({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        name: groupLabel,
      });
      core.info(`Created label: ${groupLabel}`);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "status" in error &&
        (error as { status: number }).status === 422
      ) {
        core.info(`Label ${groupLabel} already exists`);
      } else {
        throw error;
      }
    }
  }

  if (!labels.includes(groupLabel)) {
    await octokit.rest.issues.addLabels({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: parseInt(prNumber, 10),
      labels: [groupLabel],
    });
    core.info(`Added label ${groupLabel} to PR #${prNumber}`);
  }

  return groupLabel;
};

interface PRParams {
  branch: string;
  commitMessage: string;
  prTitle: string;
  prBody: string;
  assignees: string[];
  mentions: string;
}

interface GeneratePRParamsInput {
  prNumber: string;
  target: string;
  tempDir: string;
  serverUrl: string;
  repository: string;
  runId: string;
}

const generatePRParams = (input: GeneratePRParamsInput): PRParams => {
  const { prNumber, target, tempDir, serverUrl, repository, runId } = input;

  const runURL = `${serverUrl}/${repository}/actions/runs/${runId}`;
  const actor = process.env.GITHUB_ACTOR ?? "";
  const prAuthor = process.env.CI_INFO_PR_AUTHOR ?? "";

  const branch = `follow-up-${prNumber}-${target}-${new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "")}`;
  const commitMessage = `chore: create a commit to open follow up pull request
Follow up #${prNumber}
${runURL}`;
  const prTitle = `chore(${target}): follow up #${prNumber}`;

  let prBody = `This pull request was created automatically to follow up the failure of apply.
- Follow up #${prNumber} ([failed workflow](${runURL}))

Please write the description of this pull request below.

## Why did the terraform apply fail?

## How do you fix the problem?

`;

  const assignees = new Set<string>();
  if (prAuthor && !prAuthor.endsWith("[bot]")) {
    assignees.add(prAuthor);
  }
  if (actor && !actor.endsWith("[bot]") && actor !== prAuthor) {
    assignees.add(actor);
  }

  if (tempDir) {
    const prJsonPath = `${tempDir}/pr.json`;
    if (fs.existsSync(prJsonPath)) {
      try {
        const prDataRaw = JSON.parse(fs.readFileSync(prJsonPath, "utf8"));
        const prData = PRData.parse(prDataRaw);
        if (prData.assignees) {
          for (const assignee of prData.assignees) {
            assignees.add(assignee.login);
          }
        }
        prBody += `
---

<details>
<summary>Original PR description</summary>

${prData.body}

</details>
`;
      } catch (error) {
        console.error("Failed to read or parse pr.json:", error);
      }
    }
  }

  const assigneesArray = [...assignees];
  const mentions = assigneesArray.map((a) => `@${a}`).join(" ");

  return {
    branch,
    commitMessage,
    prTitle,
    prBody,
    assignees: assigneesArray,
    mentions,
  };
};

const createFailedPrsFile = (
  workingDir: string,
  serverUrl: string,
  repository: string,
  prNumber: string,
): string => {
  const tfactionDir = path.join(workingDir, ".tfaction");
  const failedPrsFile = path.join(tfactionDir, "failed-prs");

  if (!fs.existsSync(tfactionDir)) {
    fs.mkdirSync(tfactionDir, { recursive: true });
  }

  if (!fs.existsSync(failedPrsFile)) {
    fs.writeFileSync(
      failedPrsFile,
      `# This file is created and updated by tfaction for follow up pull requests.
# You can remove this file safely.
`,
    );
  }

  const prUrl = `${serverUrl}/${repository}/pull/${prNumber}`;
  fs.appendFileSync(failedPrsFile, `${prUrl}\n`);
  core.info(`Updated ${failedPrsFile} with PR URL: ${prUrl}`);

  return failedPrsFile;
};

interface SecurefixParams {
  appId: string;
  privateKey: string;
  serverRepository: string;
  branch: string;
  failedPrsFile: string;
  commitMessage: string;
  skipCreatePr: boolean;
  prTitle: string;
  prBody: string;
  baseBranch: string;
  groupLabel: string;
  assignees: string[];
  draftPr: boolean;
  mentions: string;
  prNumber: string;
}

const createViaSecurefix = async (params: SecurefixParams): Promise<void> => {
  const {
    appId,
    privateKey,
    serverRepository,
    branch,
    failedPrsFile,
    commitMessage,
    skipCreatePr,
    prTitle,
    prBody,
    baseBranch,
    groupLabel,
    assignees,
    draftPr,
    mentions,
    prNumber,
  } = params;

  if (skipCreatePr) {
    await securefix.request({
      appId,
      privateKey,
      serverRepository,
      branch,
      files: new Set([failedPrsFile]),
      commitMessage,
      workspace: process.env.GITHUB_WORKSPACE ?? "",
    });
    core.info("Created commit via securefix");
  } else {
    const prComment = `${mentions}
This pull request was created because \`terraform apply\` failed.

- #${prNumber}

Please handle this pull request.

1. Check the error message #${prNumber}
1. Check the result of \`terraform plan\`
1. Add commits to this pull request and fix the problem if needed
1. Review and merge this pull request`;

    await securefix.request({
      appId,
      privateKey,
      serverRepository,
      branch,
      files: new Set([failedPrsFile]),
      commitMessage,
      workspace: process.env.GITHUB_WORKSPACE ?? "",
      pr: {
        title: prTitle,
        body: prBody,
        base: baseBranch,
        labels: groupLabel ? [groupLabel] : undefined,
        assignees: assignees.length > 0 ? assignees : undefined,
        draft: draftPr,
        comment: prComment,
      },
    });
    core.info("Created PR via securefix");
  }
};

interface GitHubAPIParams {
  octokit: Octokit;
  githubToken: string;
  branch: string;
  failedPrsFile: string;
  commitMessage: string;
  skipCreatePr: boolean;
  prTitle: string;
  prBody: string;
  groupLabelEnabled: boolean;
  groupLabel: string;
  assignees: string[];
  draftPr: boolean;
  target: string;
  mentions: string;
  configPath: string;
  executor: aqua.Executor;
}

const createViaGitHubAPI = async (params: GitHubAPIParams): Promise<void> => {
  const {
    octokit,
    githubToken,
    branch,
    failedPrsFile,
    commitMessage,
    skipCreatePr,
    prTitle,
    prBody,
    groupLabelEnabled,
    groupLabel,
    assignees,
    draftPr,
    target,
    mentions,
    configPath,
  } = params;

  await commit.createCommit(octokit, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    branch,
    message: commitMessage,
    files: [failedPrsFile],
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

  const followUpPrUrl = pr.html_url;
  core.info(`Created PR: ${followUpPrUrl}`);
  core.notice(`The follow up pull request: ${followUpPrUrl}`);

  if (groupLabelEnabled && groupLabel) {
    await octokit.rest.issues.addLabels({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: pr.number,
      labels: [groupLabel],
    });
    core.info(`Added label ${groupLabel} to PR #${pr.number}`);
  }

  if (assignees.length > 0) {
    await octokit.rest.issues.addAssignees({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: pr.number,
      assignees,
    });
    core.info(`Added assignees ${assignees.join(", ")} to PR #${pr.number}`);
  }

  const executor = params.executor;

  if (configPath) {
    await executor.exec(
      "github-comment",
      [
        "post",
        "-config",
        configPath,
        "-var",
        `tfaction_target:${target}`,
        "-var",
        `mentions:${mentions}`,
        "-var",
        `follow_up_pr_url:${followUpPrUrl}`,
        "-k",
        "create-follow-up-pr",
      ],
      {
        env: {
          GITHUB_TOKEN: githubToken,
        },
      },
    );
    core.info("Posted comment to the original PR");
  } else {
    core.warning(
      "TFACTION_GITHUB_COMMENT_CONFIG is not set, skipping github-comment",
    );
  }
};

interface SkipCreateCommentParams {
  githubToken: string;
  configPath: string;
  repository: string;
  branch: string;
  prTitle: string;
  prNumber: string;
  draftPr: boolean;
  groupLabelEnabled: boolean;
  groupLabel: string;
  target: string;
  mentions: string;
  executor: aqua.Executor;
}

const postSkipCreateComment = async (
  params: SkipCreateCommentParams,
): Promise<void> => {
  const {
    githubToken,
    configPath,
    repository,
    branch,
    prTitle,
    prNumber,
    draftPr,
    groupLabelEnabled,
    groupLabel,
    target,
    mentions,
  } = params;

  const createOpts: string[] = [
    "-R",
    repository,
    "-H",
    branch,
    "-t",
    `"${prTitle}"`,
    "-b",
    `"Follow up #${prNumber}"`,
  ];

  if (draftPr) {
    createOpts.push("-d");
  }

  if (groupLabelEnabled && groupLabel) {
    createOpts.push("-l", groupLabel);
  }

  const optsString = createOpts.join(" ");

  const executor = params.executor;

  if (configPath) {
    await executor.exec(
      "github-comment",
      [
        "post",
        "-config",
        configPath,
        "-k",
        "skip-create-follow-up-pr",
        "-var",
        `tfaction_target:${target}`,
        "-var",
        `mentions:${mentions}`,
        "-var",
        `opts:${optsString}`,
      ],
      {
        env: {
          GITHUB_TOKEN: githubToken,
        },
      },
    );
    core.info("Posted skip-create-follow-up-pr comment");
  } else {
    core.warning(
      "TFACTION_GITHUB_COMMENT_CONFIG is not set, skipping github-comment",
    );
  }
};

export const main = async () => {
  const githubToken = core.getInput("github_token", { required: true });
  const securefixAppId = core.getInput("securefix_action_app_id") || "";
  const securefixAppPrivateKey =
    core.getInput("securefix_action_app_private_key") || "";

  const octokit = github.getOctokit(githubToken);

  const config = lib.getConfig();

  const skipCreatePr = config.skip_create_pr;
  const draftPr = config.draft_pr;
  const groupLabelEnabled = config.follow_up_pr_group_label?.enabled ?? false;
  const groupLabelPrefix =
    config.follow_up_pr_group_label?.prefix ?? "tfaction:follow-up-pr-group/";
  const securefixServerRepository =
    config.securefix_action?.server_repository ?? "";
  const securefixPRBaseBranch =
    config.securefix_action?.pull_request?.base_branch ?? "";

  // Get target config
  const targetConfig = await getTargetConfig.getTargetConfig(
    {
      target: process.env.TFACTION_TARGET,
      workingDir: process.env.TFACTION_WORKING_DIR,
      isApply: lib.getIsApply(),
      jobType: lib.getJobType(),
    },
    config,
  );

  const workingDir =
    targetConfig.working_directory || process.env.TFACTION_WORKING_DIR || "";
  const target = targetConfig.target || process.env.TFACTION_TARGET || "";

  const prNumber = process.env.CI_INFO_PR_NUMBER || "";
  const tempDir = process.env.CI_INFO_TEMP_DIR || "";
  const serverUrl = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const repository = process.env.GITHUB_REPOSITORY ?? "";
  const runId = process.env.GITHUB_RUN_ID ?? "";
  const configPath = process.env.TFACTION_GITHUB_COMMENT_CONFIG ?? "";

  const executor = await aqua.NewExecutor({
    githubToken,
    cwd: workingDir,
  });

  // Get or create group label
  const groupLabel = await getOrCreateGroupLabel({
    octokit,
    groupLabelEnabled,
    groupLabelPrefix,
    prNumber,
    tempDir,
  });

  // Generate PR parameters
  const prParams = generatePRParams({
    prNumber,
    target,
    tempDir,
    serverUrl,
    repository,
    runId,
  });

  // Create failed-prs file
  const failedPrsFile = createFailedPrsFile(
    workingDir,
    serverUrl,
    repository,
    prNumber,
  );

  // Execute based on conditions
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
      branch: prParams.branch,
      failedPrsFile,
      commitMessage: prParams.commitMessage,
      skipCreatePr,
      prTitle: prParams.prTitle,
      prBody: prParams.prBody,
      baseBranch: securefixPRBaseBranch,
      groupLabel,
      assignees: prParams.assignees,
      draftPr,
      mentions: prParams.mentions,
      prNumber,
    });
  } else {
    await createViaGitHubAPI({
      octokit,
      githubToken,
      branch: prParams.branch,
      failedPrsFile,
      commitMessage: prParams.commitMessage,
      skipCreatePr,
      prTitle: prParams.prTitle,
      prBody: prParams.prBody,
      groupLabelEnabled,
      groupLabel,
      assignees: prParams.assignees,
      draftPr,
      target,
      mentions: prParams.mentions,
      configPath,
      executor,
    });
  }

  // Post skip-create comment if skip_create_pr is true
  if (skipCreatePr) {
    await postSkipCreateComment({
      githubToken,
      configPath,
      repository,
      branch: prParams.branch,
      prTitle: prParams.prTitle,
      prNumber,
      draftPr,
      groupLabelEnabled,
      groupLabel,
      target,
      mentions: prParams.mentions,
      executor,
    });
  }
};
