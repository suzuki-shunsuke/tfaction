import * as path from "path";

import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import * as aqua from "../../aqua";
import { getTargetConfig } from "../get-target-config";
import { run } from "./run";

export const main = async () => {
  const config = await lib.getConfig();
  const githubToken = input.githubToken;
  const securefixAppId = input.securefixActionAppId;
  const securefixAppPrivateKey = input.securefixActionAppPrivateKey;

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

  const executor = await aqua.NewExecutor({
    githubToken,
    cwd: workingDir,
  });

  await run({
    config,
    targetConfig,
    githubToken,
    securefixAppId,
    securefixAppPrivateKey,
    executor,
  });
};
