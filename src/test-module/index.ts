import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "fs";
import * as path from "path";

import * as lib from "../lib";
import * as aqua from "../aqua";
import { run as runTrivy } from "../trivy";
import { run as runTflint } from "../tflint";
import { run as runTerraformDocs } from "../terraform-docs";
import { create as createCommit } from "../commit";

export const main = async () => {
  const githubToken = core.getInput("github_token", { required: true });
  const securefixAppId = core.getInput("securefix_action_app_id") || "";
  const securefixAppPrivateKey =
    core.getInput("securefix_action_app_private_key") || "";

  const config = lib.getConfig();
  const target = lib.getTargetFromEnv() || "";

  if (!target) {
    throw new Error("TFACTION_TARGET is required");
  }

  const enableTrivy = config.trivy?.enabled ?? true;
  const enableTflint = config.tflint?.enabled ?? true;
  const tflintFix = config.tflint?.fix ?? false;
  const terraformCommand = config.terraform_command;
  const securefixServerRepository =
    config.securefix_action?.server_repository ?? "";

  const executor = await aqua.NewExecutor({
    githubToken,
    cwd: target,
  });

  core.startGroup("terraform init");
  await executor.exec(
    "github-comment",
    ["exec", "-var", `tfaction_target:${target}`, "--", "terraform", "init"],
    {
      cwd: target,
      env: {
        GITHUB_TOKEN: githubToken,
        GH_COMMENT_CONFIG: lib.GitHubCommentConfig,
      },
    },
  );
  core.endGroup();

  if (enableTrivy) {
    await runTrivy({
      workingDirectory: target,
      githubToken,
      githubComment: true,
      configPath: "",
      executor,
    });
  }

  if (enableTflint) {
    await runTflint({
      workingDirectory: target,
      githubToken,
      githubTokenForTflintInit: githubToken,
      githubComment: true,
      githubTokenForFix: githubToken,
      fix: tflintFix,
      serverRepository: securefixServerRepository,
      securefixActionAppId: securefixAppId,
      securefixActionAppPrivateKey: securefixAppPrivateKey,
      executor,
    });
  }

  // Remove .terraform.lock.hcl if it exists
  const lockFilePath = path.join(target, ".terraform.lock.hcl");
  if (fs.existsSync(lockFilePath)) {
    fs.unlinkSync(lockFilePath);
    core.info("Removed .terraform.lock.hcl");
  }

  await runTerraformDocs({
    workingDirectory: target,
    githubToken,
    securefixActionAppId: securefixAppId,
    securefixActionAppPrivateKey: securefixAppPrivateKey,
    securefixActionServerRepository: securefixServerRepository,
    executor,
  });

  let fmtOutput = "";
  await executor.exec(terraformCommand, ["fmt", "-recursive"], {
    cwd: target,
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
    .map((f) => path.join(target, f));

  if (formattedFiles.length > 0) {
    core.info(`Formatted ${formattedFiles.length} files, committing...`);
    await createCommit({
      commitMessage: `style: ${terraformCommand} fmt -recursive`,
      githubToken,
      files: new Set(formattedFiles),
      serverRepository: securefixServerRepository,
      appId: securefixAppId,
      appPrivateKey: securefixAppPrivateKey,
    });
  }
};
