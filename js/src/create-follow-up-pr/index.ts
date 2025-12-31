import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as github from "@actions/github";
import * as commit from "@suzuki-shunsuke/commit-ts";
import * as fs from "fs";
import * as path from "path";

// Parse assignees from `-a user1 -a user2` format
const parseAssignees = (assigneesStr: string): string[] => {
  if (!assigneesStr) {
    return [];
  }
  const assignees: string[] = [];
  const parts = assigneesStr.split(/\s+/);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === "-a" && i + 1 < parts.length) {
      assignees.push(parts[i + 1]);
      i++;
    }
  }
  return assignees;
};

export const main = async () => {
  const workingDir = process.env.WORKING_DIR;
  if (!workingDir) {
    throw new Error("WORKING_DIR environment variable is required");
  }

  const branch = process.env.BRANCH;
  if (!branch) {
    throw new Error("BRANCH environment variable is required");
  }

  const commitMessage = process.env.COMMIT_MESSAGE;
  if (!commitMessage) {
    throw new Error("COMMIT_MESSAGE environment variable is required");
  }

  const prTitle = process.env.PR_TITLE;
  if (!prTitle) {
    throw new Error("PR_TITLE environment variable is required");
  }

  const prBody = process.env.PR_BODY ?? "";
  const draft = process.env.TFACTION_DRAFT_PR === "true";
  const assigneesStr = process.env.ASSIGNEES ?? "";
  const mentions = process.env.MENTIONS ?? "";
  const groupLabel = process.env.GROUP_LABEL ?? "";
  const groupLabelEnabled =
    process.env.FOLLOW_UP_PR_GROUP_LABEL_ENABLED === "true";
  const target = process.env.TFACTION_TARGET ?? "";

  const githubToken = core.getInput("github_token", { required: true });

  const serverUrl = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const repository = process.env.GITHUB_REPOSITORY ?? "";
  const prNumber = process.env.CI_INFO_PR_NUMBER ?? "";
  const actionPath = process.env.GITHUB_ACTION_PATH ?? "";

  // Step 1: Create commit (same logic as create-follow-up-commit)
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

  const octokit = github.getOctokit(githubToken);
  await commit.createCommit(octokit, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    branch: branch,
    message: commitMessage,
    files: [failedPrsFile],
    deleteIfNotExist: true,
    logger: {
      info: core.info,
    },
  });
  core.info(`Created commit on branch ${branch}`);

  // Step 2: Create PR using GitHub API
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
    draft: draft,
  });

  const followUpPrUrl = pr.html_url;
  core.info(`Created PR: ${followUpPrUrl}`);
  core.notice(`The follow up pull request: ${followUpPrUrl}`);

  // Add labels if group label is enabled
  if (groupLabelEnabled && groupLabel) {
    await octokit.rest.issues.addLabels({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: pr.number,
      labels: [groupLabel],
    });
    core.info(`Added label ${groupLabel} to PR #${pr.number}`);
  }

  // Add assignees
  const assignees = parseAssignees(assigneesStr);
  if (assignees.length > 0) {
    await octokit.rest.issues.addAssignees({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: pr.number,
      assignees: assignees,
    });
    core.info(`Added assignees ${assignees.join(", ")} to PR #${pr.number}`);
  }

  // Step 3: Post comment using github-comment
  const configPath = path.join(actionPath, "github-comment.yaml");
  await exec.exec(
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
        ...process.env,
        GITHUB_TOKEN: githubToken,
      },
    },
  );
  core.info("Posted comment to the original PR");
};
