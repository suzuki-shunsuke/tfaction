import * as core from "@actions/core";
import * as exec from "@actions/exec";

import * as lib from "../lib";
import { getTargetConfig } from "../get-target-config";
import { run as runConftest } from "../conftest";
import { run as runTrivy } from "../trivy/run";
import { run as runTflint } from "../tflint/run";
import { run as runTerraformDocs } from "../terraform-docs/run";
import { create as createCommit } from "../commit";

export const main = async () => {
  const config = lib.getConfig();
  const githubToken = core.getInput("github_token");
  const securefixAppId = core.getInput("securefix_action_app_id") || "";
  const securefixAppPrivateKey =
    core.getInput("securefix_action_app_private_key") || "";

  // Step 1: Get target config
  const targetConfig = await getTargetConfig(
    {
      target: process.env.TFACTION_TARGET,
      workingDir: process.env.TFACTION_WORKING_DIR,
      isApply: lib.getIsApply(),
      jobType: lib.getJobType(),
    },
    config,
  );

  const workingDir = targetConfig.working_directory;
  const destroy = targetConfig.destroy ?? false;
  const tfCommand = targetConfig.terraform_command;
  const target = targetConfig.target;
  const serverRepository = config.securefix_action?.server_repository ?? "";

  // Step 3: Conftest
  await runConftest(
    {
      workingDir,
      target,
      rootDir: process.env.GITHUB_WORKSPACE ?? "",
      githubToken,
      plan: false,
    },
    config,
  );

  // Step 4: terraform validate (skip if destroy)
  if (!destroy) {
    await exec.exec(
      "github-comment",
      [
        "exec",
        "-k",
        "terraform-validate",
        "-var",
        `tfaction_target:${target}`,
        "--",
        tfCommand,
        "validate",
      ],
      {
        cwd: workingDir,
        env: {
          ...process.env,
          GITHUB_TOKEN: githubToken,
          GH_COMMENT_CONFIG: lib.GitHubCommentConfig,
          AQUA_GLOBAL_CONFIG: lib.aquaGlobalConfig,
        },
      },
    );
  }

  // Step 5: trivy (conditional)
  if (!destroy && targetConfig.enable_trivy) {
    await runTrivy({
      workingDirectory: workingDir,
      githubToken,
      githubComment: true,
      configPath: "",
    });
  }

  // Step 7: tflint (conditional)
  if (!destroy && targetConfig.enable_tflint) {
    await runTflint({
      workingDirectory: workingDir,
      githubToken,
      githubTokenForTflintInit: "",
      githubTokenForFix: "",
      githubComment: true,
      fix: targetConfig.tflint_fix,
      serverRepository,
      securefixActionAppId: securefixAppId,
      securefixActionAppPrivateKey: securefixAppPrivateKey,
    });
  }

  // Step 8-9: terraform fmt & commit
  if (!destroy) {
    const fmtResult = await exec.getExecOutput(
      tfCommand,
      ["fmt", "-recursive"],
      {
        cwd: workingDir,
      },
    );

    const fmtOutput = fmtResult.stdout.trim();
    if (fmtOutput) {
      // Add working directory prefix to file paths
      const files = fmtOutput
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0)
        .map((f) => (workingDir ? `${workingDir}/${f}` : f));

      if (files.length > 0) {
        await createCommit({
          commitMessage: `style: ${tfCommand} fmt -recursive`,
          githubToken,
          files: new Set(files),
          serverRepository,
          appId: securefixAppId,
          appPrivateKey: securefixAppPrivateKey,
        });
      }
    }
  }

  // Step 10: terraform-docs (conditional)
  if (!destroy && targetConfig.enable_terraform_docs) {
    await runTerraformDocs({
      workingDirectory: workingDir,
      githubToken,
      securefixActionAppId: securefixAppId,
      securefixActionAppPrivateKey: securefixAppPrivateKey,
      securefixActionServerRepository: serverRepository,
    });
  }
};
