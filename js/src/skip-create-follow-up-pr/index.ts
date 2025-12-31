import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as path from "path";

export const main = async () => {
  const repository = process.env.GITHUB_REPOSITORY ?? "";
  const branch = process.env.BRANCH ?? "";
  const prTitle = process.env.PR_TITLE ?? "";
  const prNumber = process.env.CI_INFO_PR_NUMBER ?? "";
  const draft = process.env.TFACTION_DRAFT_PR === "true";
  const groupLabelEnabled =
    process.env.FOLLOW_UP_PR_GROUP_LABEL_ENABLED === "true";
  const groupLabel = process.env.GROUP_LABEL ?? "";
  const target = process.env.TFACTION_TARGET ?? "";
  const mentions = process.env.MENTIONS ?? "";
  const actionPath = process.env.GITHUB_ACTION_PATH ?? "";

  const githubToken = core.getInput("github_token", { required: true });

  // Build gh pr create options string
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

  if (draft) {
    createOpts.push("-d");
  }

  if (groupLabelEnabled && groupLabel) {
    createOpts.push("-l", groupLabel);
  }

  const optsString = createOpts.join(" ");

  // Post comment using github-comment
  const configPath = path.join(actionPath, "github-comment.yaml");
  await exec.exec(
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
        ...process.env,
        GITHUB_TOKEN: githubToken,
      },
    },
  );

  core.info("Posted skip-create-follow-up-pr comment");
};
