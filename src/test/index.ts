import * as core from "@actions/core";
import * as path from "path";

import * as lib from "../lib";
import * as aqua from "../aqua";
import { getTargetConfig } from "../get-target-config";
import { run as runConftest } from "../conftest";
import { run as runTrivy } from "../trivy";
import { run as runTflint } from "../tflint";
import { run as runTerraformDocs } from "../terraform-docs";
import { create as createCommit } from "../commit";
import { fmt } from "./fmt";

export const main = async () => {
  const config = lib.getConfig();
  const githubToken = core.getInput("github_token");
  const securefixAppId = core.getInput("securefix_action_app_id") || "";
  const securefixAppPrivateKey =
    core.getInput("securefix_action_app_private_key") || "";

  // Step 1: Get target config
  const targetConfig = await getTargetConfig(
    {
      target: lib.getTargetFromEnv(),
      workingDir: lib.getWorkingDirFromEnv(),
      isApply: lib.getIsApply(),
      jobType: lib.getJobType(),
    },
    config,
  );

  const configDir = path.dirname(config.config_path);
  const workingDir = path.join(configDir, targetConfig.working_directory);
  const destroy = targetConfig.destroy ?? false;
  const tfCommand = targetConfig.terraform_command;
  const target = targetConfig.target;
  const serverRepository = config.securefix_action?.server_repository ?? "";

  const executor = await aqua.NewExecutor({
    githubToken,
    cwd: workingDir,
  });

  await runConftest(
    {
      workingDir,
      target,
      rootDir: path.dirname(config.config_path),
      githubToken,
      plan: false,
      executor,
    },
    config,
    targetConfig,
  );

  if (!destroy) {
    core.startGroup(`${tfCommand} validate`);
    await executor.exec(
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
          GITHUB_TOKEN: githubToken,
          GH_COMMENT_CONFIG: lib.GitHubCommentConfig,
        },
      },
    );
    core.endGroup();
  }

  // Step 5: trivy (conditional)
  if (!destroy && targetConfig.enable_trivy) {
    await runTrivy({
      workingDirectory: workingDir,
      githubToken,
      githubComment: true,
      configPath: "",
      executor,
    });
  }

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
      executor,
    });
  }

  // Step 8-9: terraform fmt & commit
  if (!destroy) {
    const fmtOutput = (
      await fmt(tfCommand, workingDir, executor)
    ).stdout.trim();
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

  if (!destroy && targetConfig.enable_terraform_docs) {
    await runTerraformDocs({
      workingDirectory: workingDir,
      githubToken,
      securefixActionAppId: securefixAppId,
      securefixActionAppPrivateKey: securefixAppPrivateKey,
      securefixActionServerRepository: serverRepository,
      executor,
    });
  }
};
