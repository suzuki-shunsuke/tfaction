import * as core from "@actions/core";
import * as github from "@actions/github";
import * as input from "../../lib/input";
import * as env from "../../lib/env";
import * as lib from "../../lib";
import * as getTargetConfig from "../get-target-config";
import * as updateBranchAction from "@csm-actions/update-branch-action";
import * as githubAppToken from "@suzuki-shunsuke/github-app-token";
import { run } from "./run";

export const main = async () => {
  const githubToken = input.githubToken;
  const cfg = await lib.getConfig();
  const targetConfig = await getTargetConfig.getTargetConfig(
    {
      target: env.all.TFACTION_TARGET,
      workingDir: env.all.TFACTION_WORKING_DIR,
      isApply: true,
      jobType: lib.getJobType(),
    },
    cfg,
  );

  await run({
    githubToken,
    target: targetConfig.target,
    csmActionsServerRepository: cfg.csm_actions?.server_repository ?? "",
    csmAppId: input.csmAppId,
    csmAppPrivateKey: input.csmAppPrivateKey,
    repoOwner: github.context.repo.owner,
    repoName: github.context.repo.repo,
    serverUrl: github.context.serverUrl,
    updateBranchFn: updateBranchAction.update,
    createGithubAppToken: githubAppToken.create,
    hasExpired: githubAppToken.hasExpired,
    revokeToken: githubAppToken.revoke,
    logger: core,
  });
};
