import * as terraformApply from "./terraform";
import * as tfmigrateApply from "./tfmigrate";
import * as env from "../../lib/env";
import * as input from "../../lib/input";

export const main = async () => {
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
