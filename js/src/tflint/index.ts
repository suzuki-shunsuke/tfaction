import * as core from "@actions/core";
import { run } from "./run";

export const main = async (): Promise<void> => {
  const githubToken = core.getInput("github_token");
  await run({
    workingDirectory: core.getInput("working_directory"),
    githubToken: githubToken,
    githubTokenForTflintInit: githubToken,
    githubComment: true,
    githubTokenForFix: githubToken,
    fix: core.getBooleanInput("tflint_fix", { required: true }),
    serverRepository: core.getInput("securefix_action_server_repository"),
    securefixActionAppId: core.getInput("securefix_action_app_id"),
    securefixActionAppPrivateKey: core.getInput(
      "securefix_action_app_private_key",
    ),
  });
};
