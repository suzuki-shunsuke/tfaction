import * as core from "@actions/core";
import * as github from "@actions/github";
import * as securefix from "@csm-actions/securefix-action";
import * as commit from "@suzuki-shunsuke/commit-ts";
import * as env from "../lib/env";

export type Inputs = {
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
      workspace: env.githubWorkspace,
      pr: inputs.pr,
    });
    return "";
  }

  const octokit = github.getOctokit(inputs.githubToken);
  const branch = inputs.branch || env.githubHeadRef || env.githubRefName;
  await commit.createCommit(octokit, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    branch,
    message: inputs.commitMessage,
    files: [...inputs.files],
    deleteIfNotExist: true,
    logger: {
      info: core.info,
    },
  });
  if (!inputs.pr) {
    return "";
  }
  // create a pr
  // add assignees
  // add labels
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
    title: inputs.pr.title,
    body: inputs.pr.body,
    draft: inputs.pr.draft,
  });
  core.notice(`Created PR: ${pr.html_url}`);

  if (inputs.pr.comment) {
    await octokit.rest.issues.createComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: pr.number,
      body: inputs.pr.comment,
    });
  }

  if (inputs.pr.labels && inputs.pr.labels.length > 0) {
    await octokit.rest.issues.addLabels({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: pr.number,
      labels: inputs.pr.labels,
    });
  }

  if (inputs.pr.assignees && inputs.pr.assignees.length > 0) {
    await octokit.rest.issues.addAssignees({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: pr.number,
      assignees: inputs.pr.assignees,
    });
  }
  return pr.html_url;
};
