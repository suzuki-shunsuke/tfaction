import * as github from "@actions/github";
import * as terraformApply from "./terraform";
import * as tfmigrateApply from "./tfmigrate";
import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import * as githubApp from "../../lib/github-app";

export const main = async () => {
  const jobType = env.all.TFACTION_JOB_TYPE;
  const secrets: Record<string, string> | undefined = input.secrets
    ? JSON.parse(input.secrets)
    : undefined;

  const githubTokenForGitHubProvider =
    input.githubTokenForGitHubProvider || undefined;

  let githubToken: string;
  if (input.githubAppId && input.githubAppPrivateKey) {
    const cfg = await lib.getConfig();
    const hasSecurefix = !!cfg.securefix_action?.server_repository;
    githubToken = await githubApp.createToken({
      appId: input.githubAppId,
      privateKey: input.githubAppPrivateKey,
      owner: github.context.repo.owner,
      repositories: [github.context.repo.repo],
      permissions: {
        contents: hasSecurefix ? "read" : "write",
        pull_requests: "write",
        actions: "read",
      },
    });
  } else {
    githubToken = input.githubToken;
  }

  try {
    if (jobType === "terraform") {
      // Check if terraform should be skipped
      const skipTerraform = env.TFACTION_SKIP_TERRAFORM;

      if (!skipTerraform) {
        await terraformApply.main(
          githubToken,
          secrets,
          githubTokenForGitHubProvider,
        );
      }
    } else if (jobType === "tfmigrate") {
      await tfmigrateApply.main(
        githubToken,
        secrets,
        githubTokenForGitHubProvider,
      );
    }
  } finally {
    await githubApp.revokeAll();
  }
};
