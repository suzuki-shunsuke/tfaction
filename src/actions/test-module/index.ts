import * as path from "path";

import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import * as aqua from "../../aqua";
import { run } from "./run";

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

  const executor = await aqua.NewExecutor({
    githubToken,
    cwd: workingDir,
  });

  await run({
    config,
    target,
    workingDir,
    githubToken,
    securefixAppId,
    securefixAppPrivateKey,
    executor,
  });
};
