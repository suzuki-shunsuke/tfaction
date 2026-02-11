import * as fs from "fs";
import * as github from "@actions/github";
import * as core from "@actions/core";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import { run } from "./run";

export const main = async () => {
  const githubToken = input.getRequiredGitHubToken();
  const octokit = github.getOctokit(githubToken);
  const { owner, repo } = github.context.repo;

  await run(
    {
      modulePath: input.getRequiredModulePath(),
      version: input.getRequiredVersion(),
      sha: env.all.GITHUB_SHA,
      serverUrl: env.GITHUB_SERVER_URL,
      repository: env.all.GITHUB_REPOSITORY,
      owner,
      repo,
      logger: {
        info: core.info,
      },
    },
    {
      createRef: (params) => octokit.rest.git.createRef(params),
      createRelease: (params) => octokit.rest.repos.createRelease(params),
      isDirectory: (path) =>
        fs.existsSync(path) && fs.statSync(path).isDirectory(),
    },
  );
};
