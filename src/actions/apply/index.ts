import * as core from "@actions/core";
import * as terraformApply from "./terraform";
import * as tfmigrateApply from "./tfmigrate";
import * as env from "../../lib/env";
import * as input from "../../lib/input";

export const main = async () => {
  if (env.all.TFACTION_TEST_DIR === "true") {
    core.info("Skipping apply for test directory");
    return;
  }

  const jobType = env.all.TFACTION_JOB_TYPE;
  const secrets: Record<string, string> | undefined = input.secrets
    ? JSON.parse(input.secrets)
    : undefined;

  const githubTokenForGitHubProvider =
    input.githubTokenForGitHubProvider || undefined;

  if (jobType === "terraform") {
    await terraformApply.main(secrets, githubTokenForGitHubProvider);
  } else if (jobType === "tfmigrate") {
    await tfmigrateApply.main(secrets, githubTokenForGitHubProvider);
  }
};
