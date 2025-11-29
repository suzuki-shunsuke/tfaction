import * as core from "@actions/core";
import { run } from "./run";

export const main = async (): Promise<void> => {
  await run({
    workingDirectory: core.getInput("working_directory") || process.cwd(),
    githubToken: core.getInput("github_token"),
    securefixActionAppId: core.getInput("securefix_action_app_id"),
    securefixActionAppPrivateKey: core.getInput(
      "securefix_action_app_private_key",
    ),
    securefixActionServerRepository: core.getInput(
      "securefix_action_server_repository",
    ),
  });
};
