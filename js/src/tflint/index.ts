import * as core from "@actions/core";
import { run } from "./run";

export const main = async (): Promise<void> => {
  const githubToken = core.getInput("github_token", { required: true });
  await run({
    workingDirectory: core.getInput("working_directory", { required: false }),
    githubToken: githubToken,
    githubTokenForTflintInit: githubToken,
    githubComment: true,
    githubTokenForFix: githubToken,
    fix: core.getBooleanInput("tflint_fix", { required: true }),
    useSecurefixAction: core.getBooleanInput("use_securefix_action", {
      required: true,
    }),
  });
};
