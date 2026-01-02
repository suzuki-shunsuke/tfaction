import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as lib from "../lib";

export const main = async () => {
  const githubToken = core.getInput("github_token") || "";

  await exec.exec("aqua", ["i", "-l"], {
    env: {
      ...process.env,
      AQUA_CONFIG: lib.aquaConfig,
      AQUA_GITHUB_TOKEN: githubToken,
    },
  });

  core.exportVariable("AQUA_GLOBAL_CONFIG", lib.aquaGlobalConfig);
  core.exportVariable(
    "TFACTION_GITHUB_COMMENT_CONFIG",
    lib.GitHubCommentConfig,
  );
};
