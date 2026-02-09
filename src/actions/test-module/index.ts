import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import * as aqua from "../../aqua";
import { run } from "./run";
import { joinAbsolute } from "../../lib/paths";

export const main = async () => {
  const githubToken = input.getRequiredGitHubToken();
  const securefixAppId = input.securefixActionAppId;
  const securefixAppPrivateKey = input.securefixActionAppPrivateKey;

  const config = await lib.getConfig();
  const target = env.all.TFACTION_TARGET;
  const wd = env.all.TFACTION_WORKING_DIR;

  const workingDir = joinAbsolute(config.git_root_dir, wd || target);

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
