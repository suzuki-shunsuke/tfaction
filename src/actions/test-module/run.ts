import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";

import * as types from "../../lib/types";
import * as aqua from "../../aqua";
import { run as runTrivy } from "../../trivy";
import { run as runTflint } from "../../tflint";
import { run as runTerraformDocs } from "../../terraform-docs";
import { create as createCommit } from "../../commit";

export type RunInput = {
  config: types.Config;
  target: string;
  workingDir: string;
  githubToken: string;
  securefixAppId: string;
  securefixAppPrivateKey: string;
  executor: aqua.Executor;
  fs?: {
    existsSync: typeof fs.existsSync;
    unlinkSync: typeof fs.unlinkSync;
  };
  logger?: {
    info: (msg: string) => void;
  };
};

export const run = async (input: RunInput): Promise<void> => {
  const { config, target, workingDir, githubToken, executor } = input;
  const fileSystem = input.fs ?? {
    existsSync: fs.existsSync,
    unlinkSync: fs.unlinkSync,
  };
  const logger = input.logger ?? { info: core.info };

  const workingDirFromGitRoot = path.relative(
    config.git_root_dir,
    path.join(config.workspace, workingDir),
  );

  const enableTrivy = config.trivy?.enabled ?? true;
  const enableTflint = config.tflint?.enabled ?? true;
  const tflintFix = config.tflint?.fix ?? false;
  const terraformCommand = config.terraform_command;
  const securefixServerRepository =
    config.securefix_action?.server_repository ?? "";

  await executor.exec(terraformCommand, ["init"], {
    cwd: workingDir,
    group: `${terraformCommand} init`,
    comment: {
      token: githubToken,
      vars: {
        tfaction_target: target,
      },
    },
  });

  if (enableTrivy) {
    await runTrivy({
      workingDirectory: workingDir,
      githubToken,
      configPath: "",
      trivy: config.trivy,
      executor,
    });
  }

  if (enableTflint) {
    await runTflint({
      workingDirectory: workingDir,
      githubToken,
      githubTokenForTflintInit: githubToken,
      githubTokenForFix: githubToken,
      fix: tflintFix,
      serverRepository: securefixServerRepository,
      securefixActionAppId: input.securefixAppId,
      securefixActionAppPrivateKey: input.securefixAppPrivateKey,
      executor,
      tflint: config.tflint,
    });
  }

  // Remove .terraform.lock.hcl if it exists
  const lockFilePath = path.join(target, ".terraform.lock.hcl");
  if (fileSystem.existsSync(lockFilePath)) {
    fileSystem.unlinkSync(lockFilePath);
    logger.info("Removed .terraform.lock.hcl");
  }

  await runTerraformDocs({
    workingDirectory: workingDir,
    githubToken,
    securefixActionAppId: input.securefixAppId,
    securefixActionAppPrivateKey: input.securefixAppPrivateKey,
    securefixActionServerRepository: securefixServerRepository,
    executor,
    repoRoot: config.git_root_dir,
  });

  let fmtOutput = "";
  await executor.exec(terraformCommand, ["fmt", "-recursive"], {
    cwd: workingDir,
    listeners: {
      stdout: (data: Buffer) => {
        fmtOutput += data.toString();
      },
    },
  });

  // Process formatted files
  const formattedFiles = fmtOutput
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => f.length > 0)
    .map((f) => path.join(workingDirFromGitRoot, f));

  if (formattedFiles.length > 0) {
    logger.info(`Formatted ${formattedFiles.length} files, committing...`);
    await createCommit({
      commitMessage: `style: ${terraformCommand} fmt -recursive`,
      githubToken,
      rootDir: config.git_root_dir,
      files: new Set(formattedFiles),
      serverRepository: securefixServerRepository,
      appId: input.securefixAppId,
      appPrivateKey: input.securefixAppPrivateKey,
    });
  }
};
