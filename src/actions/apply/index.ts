import * as core from "@actions/core";
import * as terraformApply from "./terraform";
import * as tfmigrateApply from "./tfmigrate";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import { mergeSecrets } from "../../lib/secret";
import { warnSkipTerraform } from "../../lib/skip-terraform";

export const main = async () => {
  const jobType = env.all.TFACTION_JOB_TYPE;
  const secrets = mergeSecrets(input.secrets, input.awsSecrets);

  const githubTokenForGitHubProvider =
    input.githubTokenForGitHubProvider || undefined;

  if (jobType === "terraform") {
    // list-targets decides whether terraform apply is necessary, and the
    // workflow is expected to gate this step with the skip_terraform field.
    // Honor TFACTION_SKIP_TERRAFORM as a backstop for workflows that don't.
    if (env.TFACTION_SKIP_TERRAFORM) {
      core.warning(warnSkipTerraform("apply"));
      return;
    }
    await terraformApply.main(secrets, githubTokenForGitHubProvider);
  } else if (jobType === "tfmigrate") {
    await tfmigrateApply.main(secrets, githubTokenForGitHubProvider);
  }
};
