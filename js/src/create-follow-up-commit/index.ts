import * as core from "@actions/core";
import * as github from "@actions/github";
import * as commit from "@suzuki-shunsuke/commit-ts";
import * as fs from "fs";
import * as path from "path";

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

  const githubToken = core.getInput("github_token", { required: true });

  const serverUrl = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const repository = process.env.GITHUB_REPOSITORY ?? "";
  const prNumber = process.env.CI_INFO_PR_NUMBER ?? "";

  // Create/update .tfaction/failed-prs file
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

  // Append PR URL
  const prUrl = `${serverUrl}/${repository}/pull/${prNumber}`;
  fs.appendFileSync(failedPrsFile, `${prUrl}\n`);

  core.info(`Updated ${failedPrsFile} with PR URL: ${prUrl}`);

  // Create commit using commit-ts
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
};
