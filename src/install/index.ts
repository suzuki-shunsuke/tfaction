import * as core from "@actions/core";
import * as lib from "../lib";
import * as aqua from "../aqua";

export const main = async () => {
  const githubToken = core.getInput("github_token") || "";
  await aqua.NewExecutor({
    githubToken,
  });
  core.exportVariable("AQUA_GLOBAL_CONFIG", lib.aquaGlobalConfig);
};
