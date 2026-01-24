import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";
import * as path from "path";
import Handlebars from "handlebars";
import { z } from "zod";

import * as lib from "../../lib";
import * as types from "../../lib/types";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import * as aqua from "../../aqua";
import * as commit from "../../commit";
import { getTargetConfig, TargetConfig } from "../get-target-config";

const PRData = z.object({
  body: z.string().nullable(),
  assignees: z.array(
    z.object({
      login: z.string(),
    }),
  ),
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
  comment: string;
}

interface GeneratePRParamsInput {
  prNumber: string;
  target: string;
  tempDir: string;
}

const generatePRParams = (
  cfg: types.Config,
  targetConfig: TargetConfig,
  input: GeneratePRParamsInput,
): PRParams => {
  const { prNumber, target, tempDir } = input;

  const actor = env.all.GITHUB_ACTOR;
  const prAuthor = env.all.CI_INFO_PR_AUTHOR;

  const branch =
    `follow-up-${prNumber}-${target}-${new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "")}`.replaceAll(
      "/",
      "__",
    );
  const commitMessage = `chore: create a commit to open follow up pull request
Follow up #${prNumber}
${env.runURL}`;

  const assignees = new Set<string>();
  if (prAuthor && !prAuthor.endsWith("[bot]")) {
    assignees.add(prAuthor);
  }
  if (actor && !actor.endsWith("[bot]") && actor !== prAuthor) {
    assignees.add(actor);
  }

  const assigneesArray = [...assignees];
  const mentions = assigneesArray.map((a) => `@${a}`).join(" ");

  let defaultPRBody = `This pull request was created automatically to follow up the failure of apply.
      - Follow up #${prNumber} ([failed workflow](${env.runURL}))

      Please write the description of this pull request below.

      ## Why did the terraform apply fail?

      ## How do you fix the problem?

      `;

  const vars = {
    target: target,
    workingDir: targetConfig.working_directory,
    actor,
    run_url: env.runURL,
    pr_number: prNumber,
    mentions: mentions,
    original_pr_body: "",
  };

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
        defaultPRBody += `
---

<details>
<summary>Original PR description</summary>

${prData.body}

</details>
`;
        vars.original_pr_body = prData.body || "";
      } catch (error) {
        console.error("Failed to read or parse pr.json:", error);
      }
    }
  }

  const prTitle = cfg?.follow_up_pr?.pull_request?.title
    ? Handlebars.compile(cfg?.follow_up_pr?.pull_request?.title)(vars)
    : `chore(${target}): follow up #${prNumber}`;

  const prBody = cfg?.follow_up_pr?.pull_request?.body
    ? Handlebars.compile(cfg?.follow_up_pr?.pull_request?.body)(vars)
    : defaultPRBody;

  const comment = cfg?.follow_up_pr?.pull_request?.comment
    ? Handlebars.compile(cfg?.follow_up_pr?.pull_request?.comment)(vars)
    : `${mentions}
        This pull request was created because \`terraform apply\` failed.

        - #${prNumber}

        Please handle this pull request.

        1. Check the error message #${prNumber}
        1. Check the result of \`terraform plan\`
        1. Add commits to this pull request and fix the problem if needed
        1. Review and merge this pull request`;

  return {
    branch,
    commitMessage,
    prTitle,
    prBody,
    comment,
    assignees: assigneesArray,
    mentions,
  };
};

const createFailedPrsFile = (
  workingDir: string,
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

  const prUrl = `${env.GITHUB_SERVER_URL}/${env.all.GITHUB_REPOSITORY}/pull/${prNumber}`;
  fs.appendFileSync(failedPrsFile, `${prUrl}\n`);
  core.info(`Updated ${failedPrsFile} with PR URL: ${prUrl}`);

  return failedPrsFile;
};

interface SkipCreateCommentParams {
  githubToken: string;
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
  workingDir: string;
}

const postSkipCreateComment = async (
  params: SkipCreateCommentParams,
): Promise<void> => {
  const {
    githubToken,
    repository,
    branch,
    prTitle,
    prNumber,
    draftPr,
    groupLabelEnabled,
    groupLabel,
    target,
    mentions,
    workingDir,
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

  await executor.exec(
    "github-comment",
    [
      "post",
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
      cwd: workingDir,
      env: {
        GITHUB_TOKEN: githubToken,
        GH_COMMENT_CONFIG: lib.GitHubCommentConfig,
      },
    },
  );
  core.info("Posted skip-create-follow-up-pr comment");
};

export const main = async () => {
  const githubToken = input.getRequiredGitHubToken();
  const securefixAppId = input.securefixActionAppId;
  const securefixAppPrivateKey = input.securefixActionAppPrivateKey;

  const octokit = github.getOctokit(githubToken);

  const config = await lib.getConfig();

  const skipCreatePr = config.skip_create_pr;
  const draftPr = config.draft_pr;
  const groupLabelEnabled = config.follow_up_pr?.group_label?.enabled ?? false;
  const groupLabelPrefix =
    config.follow_up_pr?.group_label?.prefix ?? "tfaction:follow-up-pr-group/";
  const securefixServerRepository =
    config.securefix_action?.server_repository ?? "";
  const securefixPRBaseBranch =
    config.securefix_action?.pull_request?.base_branch ?? "";

  const jobType = lib.getJobType();

  // Get target config
  const targetConfig = await getTargetConfig(
    {
      target: env.all.TFACTION_TARGET,
      workingDir: env.all.TFACTION_WORKING_DIR,
      isApply: env.isApply,
      jobType,
    },
    config,
  );

  const workingDir = path.join(
    config.git_root_dir,
    targetConfig.working_directory,
  );
  const target = targetConfig.target;

  const prNumber = env.all.CI_INFO_PR_NUMBER;
  const tempDir = env.all.CI_INFO_TEMP_DIR;

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
  const prParams = generatePRParams(config, targetConfig, {
    prNumber,
    target,
    tempDir,
  });

  // Create failed-prs file
  const failedPrsFile = path.relative(
    config.git_root_dir,
    path.join(config.workspace, createFailedPrsFile(workingDir, prNumber)),
  );

  const labels: string[] = [];
  if (groupLabel) {
    labels.push(groupLabel);
  }
  if (jobType === "tfmigrate") {
    labels.push(config.label_prefixes.tfmigrate + target);
  }

  // Create commit and PR
  const followUpPrUrl = await commit.create({
    commitMessage: prParams.commitMessage,
    githubToken,
    rootDir: config.git_root_dir,
    files: new Set([failedPrsFile]),
    serverRepository: securefixServerRepository,
    appId: securefixAppId,
    appPrivateKey: securefixAppPrivateKey,
    branch: prParams.branch,
    pr: skipCreatePr
      ? undefined
      : {
          title: prParams.prTitle,
          body: prParams.prBody,
          base: securefixPRBaseBranch,
          labels: labels,
          assignees:
            prParams.assignees.length > 0 ? prParams.assignees : undefined,
          draft: draftPr,
          comment: prParams.comment,
        },
  });

  // Post comment to original PR (GitHub API only)
  if (followUpPrUrl) {
    await executor.exec(
      "github-comment",
      [
        "post",
        "-config",
        lib.GitHubCommentConfig,
        "-var",
        `tfaction_target:${target}`,
        "-var",
        `mentions:${prParams.mentions}`,
        "-var",
        `follow_up_pr_url:${followUpPrUrl}`,
        "-k",
        "create-follow-up-pr",
      ],
      {
        cwd: workingDir,
        env: {
          GITHUB_TOKEN: githubToken,
        },
      },
    );
    core.info("Posted comment to the original PR");
  }

  // Post skip-create comment if skip_create_pr is true
  if (skipCreatePr) {
    await postSkipCreateComment({
      githubToken,
      repository: env.all.GITHUB_REPOSITORY,
      branch: prParams.branch,
      prTitle: prParams.prTitle,
      prNumber,
      draftPr,
      groupLabelEnabled,
      groupLabel,
      target,
      mentions: prParams.mentions,
      executor,
      workingDir,
    });
  }
};
