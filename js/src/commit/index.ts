import * as core from "@actions/core";
import * as github from "@actions/github";
import * as securefix from "@csm-actions/securefix-action";
import * as commit from "@suzuki-shunsuke/commit-ts";

type Inputs = {
  commitMessage: string;
  githubToken: string;
  files: Set<string>;
  serverRepository: string;
  appId: string;
  appPrivateKey: string;
};

export const create = async (inputs: Inputs) => {
  if (inputs.serverRepository) {
    if (!inputs.appId || !inputs.appPrivateKey) {
      throw new Error(
        "app_id and app_private_key are required when securefix_action_server_repository is set",
      );
    }

    await securefix.request({
      appId: inputs.appId,
      privateKey: inputs.appPrivateKey,
      serverRepository: inputs.serverRepository,
      files: inputs.files,
      commitMessage: inputs.commitMessage,
      workspace: process.env.GITHUB_WORKSPACE ?? "",
    });
    return;
  }

  const octokit = github.getOctokit(inputs.githubToken);
  await commit.createCommit(octokit, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    branch: process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || "",
    message: inputs.commitMessage,
    files: [...inputs.files],
    deleteIfNotExist: true,
    logger: {
      info: core.info,
    },
  });
};

export const main = async () => {
  const inputs: Inputs = {
    commitMessage: core.getInput("commit_message", { required: true }),
    githubToken: core.getInput("github_token"),
    files: new Set(
      core
        .getInput("files")
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    ),
    serverRepository: core.getInput("securefix_action_server_repository"),
    appId: core.getInput("securefix_action_app_id"),
    appPrivateKey: core.getInput("securefix_action_app_private_key"),
  };
  await create(inputs);
};
