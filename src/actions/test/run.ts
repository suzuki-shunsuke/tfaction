import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";

import * as types from "../../lib/types";
import * as aqua from "../../aqua";
import { TargetConfig } from "../get-target-config";
import { run as runConftest } from "../../conftest";
import { run as runTrivy } from "./trivy";
import { run as runTflint } from "./tflint";
import { run as runTerraformDocs } from "../../terraform-docs";
import { create as createCommit } from "../../commit";
import { fmt } from "./fmt";

export type RunInput = {
  config: types.Config;
  targetConfig: TargetConfig;
  githubToken: string;
  csmAppId: string;
  csmAppPrivateKey: string;
  executor: aqua.Executor;
  fs?: {
    existsSync: typeof fs.existsSync;
    readFileSync: typeof fs.readFileSync;
    writeFileSync: typeof fs.writeFileSync;
    unlinkSync: typeof fs.unlinkSync;
  };
};

export const run = async (input: RunInput): Promise<void> => {
  const { config, targetConfig, githubToken, executor } = input;
  const isModule = targetConfig.type === "module";
  const fileSystem = input.fs ?? {
    existsSync: fs.existsSync,
    readFileSync: fs.readFileSync,
    writeFileSync: fs.writeFileSync,
    unlinkSync: fs.unlinkSync,
  };

  /** absolute path to working directory */
  const workingDir = path.join(
    config.git_root_dir,
    targetConfig.working_directory,
  );
  const destroy = targetConfig.destroy ?? false;
  const tfCommand = targetConfig.terraform_command;
  const target = targetConfig.target;
  const serverRepository = config.csm_actions?.server_repository ?? "";

  // For modules: save lock file state and run terraform init
  let lockFileExisted = false;
  let lockFileContent: string | undefined;
  if (isModule) {
    const lockFilePath = path.join(workingDir, ".terraform.lock.hcl");
    if (fileSystem.existsSync(lockFilePath)) {
      lockFileExisted = true;
      lockFileContent = fileSystem.readFileSync(lockFilePath, "utf8");
    }

    await executor.exec(tfCommand, ["init"], {
      cwd: workingDir,
      group: `${tfCommand} init`,
      comment: {
        token: githubToken,
        vars: {
          tfaction_target: target,
        },
      },
    });
  }

  if (!destroy && !isModule) {
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

  if (!destroy && !isModule) {
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
      gitRootDir: config.git_root_dir,
      githubToken,
      githubTokenForTflintInit: "",
      githubTokenForFix: "",
      fix: targetConfig.tflint_fix,
      serverRepository,
      csmAppId: input.csmAppId,
      csmAppPrivateKey: input.csmAppPrivateKey,
      executor,
      tflint: config.tflint,
    });
  }

  // For modules: handle lock file after tools run
  if (isModule) {
    const lockFilePath = path.join(workingDir, ".terraform.lock.hcl");
    if (!lockFileExisted) {
      // Lock file didn't exist before init - delete it if it was created
      if (fileSystem.existsSync(lockFilePath)) {
        fileSystem.unlinkSync(lockFilePath);
        core.info("Removed .terraform.lock.hcl created by terraform init");
      }
    } else if (lockFileContent !== undefined) {
      // Lock file existed before - revert if modified
      if (fileSystem.existsSync(lockFilePath)) {
        const currentContent = fileSystem.readFileSync(lockFilePath, "utf8");
        if (currentContent !== lockFileContent) {
          fileSystem.writeFileSync(lockFilePath, lockFileContent);
          core.info("Reverted .terraform.lock.hcl to original content");
        }
      } else {
        // Lock file was deleted by a tool - restore it
        fileSystem.writeFileSync(lockFilePath, lockFileContent);
        core.info("Restored deleted .terraform.lock.hcl");
      }
    }
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
        .map((f) => path.join(targetConfig.working_directory, f));

      if (files.length > 0) {
        await createCommit({
          commitMessage: `style: ${tfCommand} fmt -recursive`,
          githubToken,
          files: new Set(files),
          serverRepository,
          appId: input.csmAppId,
          appPrivateKey: input.csmAppPrivateKey,
        });
        if (!isModule) {
          throw new Error("code will be automatically formatted");
        }
      }
    }
  }

  if (!destroy && targetConfig.enable_terraform_docs) {
    await runTerraformDocs({
      workingDirectory: workingDir,
      githubToken,
      csmAppId: input.csmAppId,
      csmAppPrivateKey: input.csmAppPrivateKey,
      csmActionsServerRepository: serverRepository,
      executor,
      repoRoot: config.git_root_dir,
    });
  }
};
