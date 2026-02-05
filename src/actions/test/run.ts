import * as path from "path";

import * as types from "../../lib/types";
import * as aqua from "../../aqua";
import { TargetConfig } from "../get-target-config";
import { run as runConftest } from "../../conftest";
import { run as runTrivy } from "../../trivy";
import { run as runTflint } from "../../tflint";
import { run as runTerraformDocs } from "../../terraform-docs";
import { create as createCommit } from "../../commit";
import { fmt } from "./fmt";

export type RunInput = {
  config: types.Config;
  targetConfig: TargetConfig;
  githubToken: string;
  securefixAppId: string;
  securefixAppPrivateKey: string;
  executor: aqua.Executor;
};

export const run = async (input: RunInput): Promise<void> => {
  const { config, targetConfig, githubToken, executor } = input;

  const workingDir = path.join(
    config.git_root_dir,
    targetConfig.working_directory,
  );
  const destroy = targetConfig.destroy ?? false;
  const tfCommand = targetConfig.terraform_command;
  const target = targetConfig.target;
  const serverRepository = config.securefix_action?.server_repository ?? "";

  if (!destroy) {
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
  }

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
      securefixActionAppId: input.securefixAppId,
      securefixActionAppPrivateKey: input.securefixAppPrivateKey,
      executor,
      tflint: config.tflint,
    });
  }

  if (!destroy) {
    const fmtOutput = (
      await fmt(tfCommand, workingDir, executor)
    ).stdout.trim();
    if (fmtOutput) {
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
          appId: input.securefixAppId,
          appPrivateKey: input.securefixAppPrivateKey,
        });
      }
    }
  }

  if (!destroy && targetConfig.enable_terraform_docs) {
    await runTerraformDocs({
      workingDirectory: workingDir,
      githubToken,
      securefixActionAppId: input.securefixAppId,
      securefixActionAppPrivateKey: input.securefixAppPrivateKey,
      securefixActionServerRepository: serverRepository,
      executor,
      repoRoot: config.git_root_dir,
    });
  }
};
