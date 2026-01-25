import * as github from "@actions/github";
import * as fs from "fs";
import * as core from "@actions/core";
import * as env from "../../lib/env";
import * as input from "../../lib/input";

export const main = async () => {
  const modulePath = input.getRequiredModulePath();
  const version = input.getRequiredVersion();
  const githubToken = input.getRequiredGitHubToken();

  // Validate inputs
  if (!modulePath) {
    throw new Error("module_path is required");
  }
  if (!version) {
    throw new Error("version is required");
  }

  // Check if module path exists
  if (!fs.existsSync(modulePath) || !fs.statSync(modulePath).isDirectory()) {
    throw new Error(`module_path is invalid. ${modulePath} isn't found`);
  }

  // Generate tag name
  const moduleName = modulePath.replace(/\//g, "_");
  const tag = `module_${moduleName}_${version}`;
  core.info(`Tag: ${tag}`);

  const octokit = github.getOctokit(githubToken);
  const { owner, repo } = github.context.repo;
  const sha = env.all.GITHUB_SHA;
  const serverUrl = env.GITHUB_SERVER_URL;
  const repository = env.all.GITHUB_REPOSITORY;

  // Create tag
  core.info(`Creating tag ${tag}`);
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/tags/${tag}`,
    sha,
  });

  // Create release
  const note = `module: ${modulePath}
version: ${version}

[Source code](${serverUrl}/${repository}/tree/${tag}/${modulePath})
[Versions](${serverUrl}/${repository}/releases?q=${modulePath})`;

  core.info(`Creating release ${tag}`);
  await octokit.rest.repos.createRelease({
    owner,
    repo,
    tag_name: tag,
    name: tag,
    body: note,
  });

  core.info(`Released ${tag}`);
};
