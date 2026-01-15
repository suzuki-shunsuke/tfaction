import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import * as aqua from "../../aqua";
import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as git from "../../lib/git";
import * as commit from "../../commit";

type Inputs = {
  githubToken: string;
  securefixActionAppId: string;
  securefixActionAppPrivateKey: string;
};

const getInputs = (): Inputs => {
  return {
    githubToken: core.getInput("github_token") || env.githubToken,
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
  // File is not tracked, so it's a new file
  if (!(await git.isFileTracked(checksumFile, workingDir))) {
    return true;
  }
  // Check if file has changes
  return await git.hasFileChanged(checksumFile, workingDir);
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

  await commit.create({
    commitMessage: `chore(aqua): update ${checksumFile}`,
    githubToken: inputs.githubToken,
    rootDir: gitRootDir,
    files: new Set([checksumFileFromRootDir]),
    serverRepository: cfg?.securefix_action?.server_repository ?? "",
    appId: inputs.securefixActionAppId,
    appPrivateKey: inputs.securefixActionAppPrivateKey,
  });
  throw new Error(`${checksumFileOutput} is updated.`);
};
