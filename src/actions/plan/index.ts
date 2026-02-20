import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";
import * as path from "path";

import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import * as git from "../../lib/git";
import { getTargetConfig } from "../get-target-config";
import { main as runPlan } from "./run";
import { create as createCommit } from "../../commit";
import { mergeSecrets } from "../../lib/secret";

export const main = async () => {
  // Step 1: Get target config
  const config = await lib.getConfig();
  const targetConfig = await getTargetConfig(
    {
      target: env.all.TFACTION_TARGET,
      workingDir: env.all.TFACTION_WORKING_DIR,
      isApply: env.isApply,
      jobType: lib.getJobType(),
    },
    config,
  );

  const jobType = env.all.TFACTION_JOB_TYPE;
  const driftIssueNumber = env.all.TFACTION_DRIFT_ISSUE_NUMBER;

  await runPlan(targetConfig, {
    githubToken: input.githubToken,
    githubTokenForGitHubProvider: input.githubTokenForGitHubProvider,
    jobType: jobType,
    driftIssueNumber: driftIssueNumber,
    prAuthor: env.all.CI_INFO_PR_AUTHOR,
    ciInfoTempDir: env.all.CI_INFO_TEMP_DIR,
    prNumber: github.context.issue.number,
    secrets: mergeSecrets(input.secrets, input.awsSecrets),
  });

  // Step 5: Commit .tfmigrate.hcl if changed (for tfmigrate job type)
  if (jobType === "tfmigrate") {
    const workingDir = targetConfig.working_directory;
    if (workingDir) {
      const tfmigrateHclPath = path.join(
        config.git_root_dir,
        workingDir,
        ".tfmigrate.hcl",
      );
      const serverRepository = config.csm_actions?.server_repository ?? "";

      if (fs.existsSync(tfmigrateHclPath)) {
        // If the file is new or modified, commit it
        if (
          await git.hasFileChangedPorcelain(
            tfmigrateHclPath,
            config.git_root_dir,
          )
        ) {
          core.info("Committing .tfmigrate.hcl");
          await createCommit({
            commitMessage: "chore(tfmigrate): add .tfmigrate.hcl",
            githubToken: input.githubToken,
            rootDir: config.git_root_dir,
            files: new Set([
              path.relative(config.git_root_dir, tfmigrateHclPath),
            ]),
            serverRepository,
            appId: input.csmAppId,
            appPrivateKey: input.csmAppPrivateKey,
          });
        }
      }
    }
  }
};
