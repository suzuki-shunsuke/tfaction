import * as github from "@actions/github";
import * as path from "path";

import { getTargetConfig } from "../get-target-config";
import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import * as aqua from "../../aqua";
import { isPullRequestEvent, run } from "./run";

export const main = async () => {
  const githubToken = input.getRequiredGitHubToken();
  const config = await lib.getConfig();

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
  const tfCommand = targetConfig.terraform_command;

  const executor = await aqua.NewExecutor({
    githubToken,
    cwd: workingDir,
  });

  const terragruntRunAvailable =
    tfCommand === "terragrunt" &&
    (await aqua.checkTerrgruntRun(executor, workingDir));

  await run({
    isPullRequest: isPullRequestEvent(github.context.eventName),
    workingDir,
    tfCommand,
    providersLockOpts: targetConfig.providers_lock_opts,
    githubToken,
    workspace: config.workspace,
    gitRootDir: config.git_root_dir,
    terragruntRunAvailable,
    executor,
    serverRepository: config.securefix_action?.server_repository ?? "",
    appId: input.securefixActionAppId,
    appPrivateKey: input.securefixActionAppPrivateKey,
  });
};
