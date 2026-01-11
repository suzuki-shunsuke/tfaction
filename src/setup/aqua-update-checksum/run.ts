import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as github from "@actions/github";
import * as securefix from "@csm-actions/securefix-action";
import * as commit from "@suzuki-shunsuke/commit-ts";
import * as fs from "fs";
import * as path from "path";
import * as aqua from "../../aqua";

type Inputs = {
  workingDirectory: string;
  prune: boolean;
  skipPush: boolean;
  githubToken: string;
  readChecksumToken: string;
  securefixActionServerRepository: string;
  securefixActionAppId: string;
  securefixActionAppPrivateKey: string;
};

const getInputs = (): Inputs => {
  return {
    workingDirectory: core.getInput("working_directory"),
    prune: core.getInput("prune") === "true",
    skipPush: core.getInput("skip_push") === "true",
    githubToken:
      core.getInput("github_token") || process.env.GITHUB_TOKEN || "",
    readChecksumToken: core.getInput("read_checksum_token"),
    securefixActionServerRepository: core.getInput(
      "securefix_action_server_repository",
    ),
    securefixActionAppId: core.getInput("securefix_action_app_id"),
    securefixActionAppPrivateKey: core.getInput(
      "securefix_action_app_private_key",
    ),
  };
};

const getAquaGitHubToken = (inputs: Inputs): string => {
  if (inputs.readChecksumToken) {
    return inputs.readChecksumToken;
  }
  if (inputs.githubToken) {
    return inputs.githubToken;
  }
  return process.env.AQUA_GITHUB_TOKEN || "";
};

const runAquaUpdateChecksum = async (inputs: Inputs): Promise<void> => {
  const args = ["update-checksum"];
  if (inputs.prune) {
    args.push("-prune");
  }

  const aquaToken = getAquaGitHubToken(inputs);

  const executor = await aqua.NewExecutor({
    githubToken: aquaToken,
    cwd: inputs.workingDirectory,
  });

  await executor.exec("aqua", args, {
    cwd: inputs.workingDirectory || undefined,
  });
};

const findChecksumFile = (workingDir: string): string | null => {
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

  return null;
};

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

const createCommitIfNeeded = async (
  inputs: Inputs,
  checksumFile: string,
): Promise<void> => {
  const fullChecksumFilePath = inputs.workingDirectory
    ? path.join(inputs.workingDirectory, checksumFile)
    : checksumFile;

  const commitMessage = `chore(aqua): update ${checksumFile}`;

  if (inputs.securefixActionServerRepository) {
    if (!inputs.securefixActionAppId || !inputs.securefixActionAppPrivateKey) {
      throw new Error(
        "app_id and app_private_key are required when securefix_action_server_repository is set",
      );
    }

    await securefix.request({
      appId: inputs.securefixActionAppId,
      privateKey: inputs.securefixActionAppPrivateKey,
      serverRepository: inputs.securefixActionServerRepository,
      files: new Set([fullChecksumFilePath]),
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
    files: [fullChecksumFilePath],
    deleteIfNotExist: true,
    logger: {
      info: core.info,
    },
  });
};

export const main = async () => {
  const inputs = getInputs();

  // Run aqua update-checksum
  await runAquaUpdateChecksum(inputs);

  // Find checksum file
  const workingDir = inputs.workingDirectory || process.cwd();
  const checksumFile = findChecksumFile(workingDir);

  if (!checksumFile) {
    throw new Error("aqua checksum json file isn't found");
  }

  // Set output for checksum_file
  const checksumFileOutput = inputs.workingDirectory
    ? path.join(inputs.workingDirectory, checksumFile)
    : checksumFile;
  core.setOutput("checksum_file", checksumFileOutput);

  // Check if file has changed
  const changed = await checkIfChanged(checksumFile, workingDir);
  core.setOutput("changed", changed.toString());

  if (!changed) {
    core.info("No changes to checksum file");
    return;
  }

  // If skip_push is true and there are changes, fail
  if (inputs.skipPush) {
    throw new Error(`${checksumFileOutput} isn't latest.`);
  }

  // Create commit
  await createCommitIfNeeded(inputs, checksumFile);
  throw new Error(`${checksumFileOutput} is updated.`);
};
