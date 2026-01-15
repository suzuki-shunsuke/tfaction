import * as core from "@actions/core";
import * as lib from "../lib";
import * as aqua from "../aqua";
import * as input from "../lib/input";

export const main = async () => {
  await aqua.NewExecutor({
    githubToken: input.githubToken,
  });
  core.exportVariable("AQUA_GLOBAL_CONFIG", lib.aquaGlobalConfig);
};
