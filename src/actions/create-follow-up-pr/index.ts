import * as env from "../../lib/env";
import * as input from "../../lib/input";
import { run } from "./run";

export const main = async () => {
  await run({
    githubToken: input.getRequiredGitHubToken(),
    securefixAppId: input.securefixActionAppId,
    securefixAppPrivateKey: input.securefixActionAppPrivateKey,
    actor: env.all.GITHUB_ACTOR,
    prAuthor: env.all.CI_INFO_PR_AUTHOR,
    target: env.all.TFACTION_TARGET,
    workingDir: env.all.TFACTION_WORKING_DIR,
    isApply: env.isApply,
    prNumber: env.all.CI_INFO_PR_NUMBER,
    tempDir: env.all.CI_INFO_TEMP_DIR,
    repository: env.all.GITHUB_REPOSITORY,
    runURL: env.runURL,
    githubServerUrl: env.GITHUB_SERVER_URL,
  });
};
