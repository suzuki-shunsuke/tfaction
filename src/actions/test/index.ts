import * as path from "path";

import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import * as aqua from "../../aqua";
import { getTargetConfig } from "../get-target-config";
import { run as runConftest } from "../../conftest";
import { run as runTrivy } from "../../trivy";
import { run as runTflint } from "../../tflint";
import { run as runTerraformDocs } from "../../terraform-docs";
import { create as createCommit } from "../../commit";
import { fmt } from "./fmt";

export const main = async () => {
  const config = await lib.getConfig();
  const githubToken = input.githubToken;
  const securefixAppId = input.securefixActionAppId;
  const securefixAppPrivateKey = input.securefixActionAppPrivateKey;

  // Step 1: Get target config
  const targetConfig = await getTargetConfig(
    {
      target: env.all.TFACTION_TARGET,
      workingDir: env.all.TFACTION_WORKING_DIR,
      isApply: env.isApply,
      jobType: lib.getJobType(),
    },
    config,
  );

  const workingDir = path.join(
    config.git_root_dir,
    targetConfig.working_directory,
  );
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
      gitRootDir: config.git_root_dir,
      githubToken,
      plan: false,
      executor,
    },
    config,
    targetConfig,
  );

  if (!destroy) {
    await executor.exec(tfCommand, ["validate"], {
      cwd: workingDir,
      group: `${tfCommand} validate`,
      comment: {
        token: githubToken,
        key: "terraform-validate",
        vars: {
          tfaction_target: target,
        },
      },
    });
  }

  // Step 5: trivy (conditional)
  if (!destroy && targetConfig.enable_trivy) {
    await runTrivy({
      workingDirectory: workingDir,
      githubToken,
      configPath: "",
      trivy: config.trivy,
      executor,
    });
  }

  if (!destroy && targetConfig.enable_tflint) {
    await runTflint({
      workingDirectory: workingDir,
      githubToken,
      githubTokenForTflintInit: "",
      githubTokenForFix: "",
      fix: targetConfig.tflint_fix,
      serverRepository,
      securefixActionAppId: securefixAppId,
      securefixActionAppPrivateKey: securefixAppPrivateKey,
      executor,
      tflint: config.tflint,
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
      repoRoot: config.git_root_dir,
    });
  }
};
