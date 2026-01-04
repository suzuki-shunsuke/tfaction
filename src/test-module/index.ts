import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "fs";
import * as path from "path";

import * as lib from "../lib";
import { run as runTrivy } from "../trivy/run";
import { run as runTflint } from "../tflint/run";
import { run as runTerraformDocs } from "../terraform-docs/run";
import { create as createCommit } from "../commit";

export const main = async () => {
  const githubToken = core.getInput("github_token", { required: true });
  const securefixAppId = core.getInput("securefix_action_app_id") || "";
  const securefixAppPrivateKey =
    core.getInput("securefix_action_app_private_key") || "";

  const config = lib.getConfig();
  const target = process.env.TFACTION_TARGET || "";

  if (!target) {
    throw new Error("TFACTION_TARGET is required");
  }

  const enableTrivy = config.trivy?.enabled ?? true;
  const enableTflint = config.tflint?.enabled ?? true;
  const tflintFix = config.tflint?.fix ?? false;
  const terraformCommand = config.terraform_command;
  const securefixServerRepository =
    config.securefix_action?.server_repository ?? "";

  core.startGroup("aqua i -l -a");
  await exec.exec("aqua", ["i", "-l", "-a"], {
    cwd: target,
    env: {
      ...process.env,
      AQUA_GLOBAL_CONFIG: lib.aquaGlobalConfig,
    },
  });
  core.endGroup();

  core.startGroup("terraform init");
  await exec.exec(
    "github-comment",
    ["exec", "-var", `tfaction_target:${target}`, "--", "terraform", "init"],
    {
      cwd: target,
      env: {
        ...process.env,
        GITHUB_TOKEN: githubToken,
        GH_COMMENT_CONFIG: process.env.TFACTION_GITHUB_COMMENT_CONFIG ?? "",
        AQUA_GLOBAL_CONFIG: lib.aquaGlobalConfig,
      },
    },
  );
  core.endGroup();

  // Run trivy
  if (enableTrivy) {
    core.info("Running trivy");
    await runTrivy({
      workingDirectory: target,
      githubToken,
      githubComment: true,
      configPath: "",
    });
  }

  // Run tflint
  if (enableTflint) {
    core.info("Running tflint");
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
    });
  }

  // Remove .terraform.lock.hcl if it exists
  const lockFilePath = path.join(target, ".terraform.lock.hcl");
  if (fs.existsSync(lockFilePath)) {
    fs.unlinkSync(lockFilePath);
    core.info("Removed .terraform.lock.hcl");
  }

  // Run terraform-docs
  core.info("Running terraform-docs");
  await runTerraformDocs({
    workingDirectory: target,
    githubToken,
    securefixActionAppId: securefixAppId,
    securefixActionAppPrivateKey: securefixAppPrivateKey,
    securefixActionServerRepository: securefixServerRepository,
  });

  // Run terraform fmt
  core.info("Running terraform fmt");
  let fmtOutput = "";
  await exec.exec(terraformCommand, ["fmt", "-recursive"], {
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
