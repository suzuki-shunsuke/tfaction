import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";

export const main = async () => {
  const enabled = process.env.FOLLOW_UP_PR_GROUP_LABEL_ENABLED;
  if (enabled !== "true") {
    core.info("Group label feature is disabled");
    return;
  }

  const prefix = process.env.FOLLOW_UP_PR_GROUP_LABEL_PREFIX;
  if (!prefix) {
    throw new Error(
      "FOLLOW_UP_PR_GROUP_LABEL_PREFIX environment variable is required",
    );
  }

  const prNumber = process.env.CI_INFO_PR_NUMBER;
  if (!prNumber) {
    throw new Error("CI_INFO_PR_NUMBER environment variable is required");
  }

  const tempDir = process.env.CI_INFO_TEMP_DIR;
  if (!tempDir) {
    throw new Error("CI_INFO_TEMP_DIR environment variable is required");
  }

  const githubToken = core.getInput("github_token", { required: true });
  const octokit = github.getOctokit(githubToken);

  // Read labels from labels.txt
  const labelsFilePath = `${tempDir}/labels.txt`;
  let labels: string[] = [];
  if (fs.existsSync(labelsFilePath)) {
    const content = fs.readFileSync(labelsFilePath, "utf8");
    labels = content.split("\n").filter((l) => l.length > 0);
  }

  // Find existing group label
  const groupLabelPattern = new RegExp(`${escapeRegExp(prefix)}[0-9]+`);
  let groupLabel = labels.find((label) => groupLabelPattern.test(label));

  if (!groupLabel) {
    // Create new group label
    groupLabel = `${prefix}${prNumber}`;
    try {
      await octokit.rest.issues.createLabel({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        name: groupLabel,
      });
      core.info(`Created label: ${groupLabel}`);
    } catch (error: unknown) {
      // Label might already exist, ignore the error
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
    core.setOutput("label", groupLabel);
  }

  // Check if PR already has the label
  if (!labels.includes(groupLabel)) {
    await octokit.rest.issues.addLabels({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: parseInt(prNumber, 10),
      labels: [groupLabel],
    });
    core.info(`Added label ${groupLabel} to PR #${prNumber}`);
  }
};

// Escape special regex characters
const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
