import * as core from "@actions/core";
import * as github from "@actions/github";
import * as securefix from "@csm-actions/securefix-action";
import * as env from "../lib/env";
import { run } from "./run";

type Inputs = {
  commitMessage: string;
  githubToken: string;
  /** A relative path from github.workspace to Git Root Directory */
  rootDir?: string;
  /** Relative paths from Git Root Directory */
  files: Set<string>;
  serverRepository: string;
  appId: string;
  appPrivateKey: string;
  branch?: string;
  pr?: securefix.PullRequest;
};

export const create = async (inputs: Inputs): Promise<string> => {
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
      branch: inputs.branch,
      files: inputs.files,
      commitMessage: inputs.commitMessage,
      workspace: env.GITHUB_WORKSPACE,
      pr: inputs.pr,
    });
    return "";
  }

  const octokit = github.getOctokit(inputs.githubToken);
  const branch =
    inputs.branch || env.all.GITHUB_HEAD_REF || env.all.GITHUB_REF_NAME;

  return run({
    commitMessage: inputs.commitMessage,
    files: inputs.files,
    branch,
    repoOwner: github.context.repo.owner,
    repoName: github.context.repo.repo,
    octokit,
    logger: { info: core.info, notice: core.notice },
    pr: inputs.pr,
  });
};
