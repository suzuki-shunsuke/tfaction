import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as github from "@actions/github";
import * as securefix from "@csm-actions/securefix-action";
import * as commit from "@suzuki-shunsuke/commit-ts";
import * as fs from "fs";
import * as path from "path";
import * as aqua from "../../aqua";
import * as lib from "../../lib";

type Inputs = {
  githubToken: string;
  securefixActionAppId: string;
  securefixActionAppPrivateKey: string;
};

const getInputs = (): Inputs => {
  return {
    githubToken:
      core.getInput("github_token") || process.env.GITHUB_TOKEN || "",
    securefixActionAppId: core.getInput("securefix_action_app_id"),
    securefixActionAppPrivateKey: core.getInput(
      "securefix_action_app_private_key",
    ),
  };
};

/**
 *
 * @param executor
 * @param workingDir a relative path from github.workspace
 * @param cfg
 */
const runAquaUpdateChecksum = async (
  executor: aqua.Executor,
  workingDir: string,
  prune: boolean,
): Promise<void> => {
  const args = ["update-checksum"];
  if (prune) {
    args.push("-prune");
  }

  await executor.exec("aqua", args, {
    cwd: workingDir,
  });
};

/**
 *
 * @param workingDir a relative path from github.workspace
 * @returns a relative path from workingDir
 */
const findChecksumFile = (workingDir: string): string => {
  const candidates = [
    "aqua-checksums.json",
    ".aqua-checksums.json",
    "aqua/aqua-checksums.json",
    "aqua/.aqua-checksums.json",
    ".aqua/aqua-checksums.json",
    ".aqua/.aqua-checksums.json",
  ];

  for (const candidate of candidates) {
    const fullPath = path.join(workingDir, candidate);
    if (fs.existsSync(fullPath)) {
      return candidate;
    }
  }
  return "";
};

/**
 *
 * @param checksumFile a relative path from workingDir
 * @param workingDir a relative path from github.workspace
 * @returns
 */
const checkIfChanged = async (
  checksumFile: string,
  workingDir: string,
): Promise<boolean> => {
  const lsFilesExitCode = await exec.exec(
    "git",
    ["ls-files", "--error-unmatch", "--", checksumFile],
    {
      cwd: workingDir,
      ignoreReturnCode: true,
      silent: true,
    },
  );

  if (lsFilesExitCode !== 0) {
    // File is not tracked, so it's a new file
    return true;
  }

  // Check if file has changes
  const diffExitCode = await exec.exec(
    "git",
    ["diff", "--quiet", "--", checksumFile],
    {
      cwd: workingDir,
      ignoreReturnCode: true,
      silent: true,
    },
  );

  // git diff --quiet returns 0 if no changes, 1 if there are changes
  return diffExitCode !== 0;
};

/**
 *
 * @param inputs
 * @param checksumFile a relative path from git root directory
 * @param cfg
 * @returns
 */
const createCommitIfNeeded = async (
  inputs: Inputs,
  checksumFile: string,
  cfg: lib.Config,
): Promise<void> => {
  const commitMessage = `chore(aqua): update ${checksumFile}`;

  if (cfg?.securefix_action?.server_repository) {
    if (!inputs.securefixActionAppId || !inputs.securefixActionAppPrivateKey) {
      throw new Error(
        "app_id and app_private_key are required when securefix_action_server_repository is set",
      );
    }

    await securefix.request({
      appId: inputs.securefixActionAppId,
      privateKey: inputs.securefixActionAppPrivateKey,
      serverRepository: cfg.securefix_action.server_repository,
      files: new Set([checksumFile]),
      commitMessage: commitMessage,
      workspace: process.env.GITHUB_WORKSPACE ?? "",
    });
    return;
  }

  const octokit = github.getOctokit(inputs.githubToken);
  await commit.createCommit(octokit, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    branch: process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || "",
    message: commitMessage,
    files: [checksumFile],
    deleteIfNotExist: true,
    logger: {
      info: core.info,
    },
  });
};

/**
 *
 * @param executor
 * @param workingDir a relative path from github.workspace
 * @param cfg
 */
export const main = async (
  executor: aqua.Executor,
  workingDir: string,
  cfg: lib.Config,
) => {
  const inputs = getInputs();
  await runAquaUpdateChecksum(
    executor,
    workingDir,
    cfg.aqua?.update_checksum?.prune ?? false,
  );
  const checksumFile = findChecksumFile(workingDir);
  if (!checksumFile) {
    return;
  }
  // a relative path from github.workspace
  const checksumFileOutput = path.join(workingDir, checksumFile);

  // Check if file has changed
  const changed = await checkIfChanged(checksumFile, workingDir);

  if (!changed) {
    core.info("No changes to checksum file");
    return;
  }

  // If skip_push is true and there are changes, fail
  if (cfg?.aqua?.update_checksum?.skip_push) {
    throw new Error(`${checksumFileOutput} isn't latest.`);
  }

  const gitRootDir = await lib.getGitRootDir(workingDir);
  const workspace = lib.getGitHubWorkspace();
  const checksumFileFromRootDir = path.relative(
    gitRootDir,
    path.join(workspace, checksumFileOutput),
  );

  await createCommitIfNeeded(inputs, checksumFileFromRootDir, cfg);
  throw new Error(`${checksumFileOutput} is updated.`);
};
