import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";
import * as path from "path";

import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import * as aqua from "../../aqua";
import { run as runTrivy } from "../../trivy";
import { run as runTflint } from "../../tflint";
import { run as runTerraformDocs } from "../../terraform-docs";
import { create as createCommit } from "../../commit";
import { hasFileChangedPorcelain } from "../../lib/git";

export const main = async () => {
  const githubToken = input.getRequiredGitHubToken();
  const securefixAppId = input.securefixActionAppId;
  const securefixAppPrivateKey = input.securefixActionAppPrivateKey;

  const config = await lib.getConfig();
  const target = env.all.TFACTION_TARGET;
  const wd = env.all.TFACTION_WORKING_DIR;

  if (!wd && !target) {
    throw new Error(
      "Either TFACTION_WORKING_DIR or TFACTION_TARGET is required",
    );
  }

  // absolute path to working dir
  const workingDir = path.join(config.git_root_dir, wd || target);

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

  const executor = await aqua.NewExecutor({
    githubToken,
    cwd: workingDir,
  });

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
      config,
      executor,
      eventName: github.context.eventName,
      logger: { info: core.info },
      githubCommentConfig: lib.GitHubCommentConfig,
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
      securefixActionAppId: securefixAppId,
      securefixActionAppPrivateKey: securefixAppPrivateKey,
      executor,
      tflint: config.tflint,
      eventName: github.context.eventName,
      logger: {
        startGroup: core.startGroup,
        endGroup: core.endGroup,
        info: core.info,
        setOutput: core.setOutput,
      },
      githubCommentConfig: lib.GitHubCommentConfig,
      createCommit,
      checkGitDiff: async (files: string[]) => {
        const changedFiles: string[] = [];
        for (const file of files) {
          const changed = await hasFileChangedPorcelain(file);
          if (changed) {
            changedFiles.push(file);
          }
        }
        return { changedFiles };
      },
    });
  }

  // Remove .terraform.lock.hcl if it exists
  const lockFilePath = path.join(target, ".terraform.lock.hcl");
  if (fs.existsSync(lockFilePath)) {
    fs.unlinkSync(lockFilePath);
    core.info("Removed .terraform.lock.hcl");
  }

  await runTerraformDocs({
    workingDirectory: workingDir,
    githubToken,
    securefixActionAppId: securefixAppId,
    securefixActionAppPrivateKey: securefixAppPrivateKey,
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
    core.info(`Formatted ${formattedFiles.length} files, committing...`);
    await createCommit({
      commitMessage: `style: ${terraformCommand} fmt -recursive`,
      githubToken,
      rootDir: config.git_root_dir,
      files: new Set(formattedFiles),
      serverRepository: securefixServerRepository,
      appId: securefixAppId,
      appPrivateKey: securefixAppPrivateKey,
    });
  }
};
