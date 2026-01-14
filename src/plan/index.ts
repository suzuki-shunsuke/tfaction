import * as core from "@actions/core";
import * as fs from "fs";

import * as lib from "../lib";
import * as env from "../lib/env";
import * as git from "../lib/git";
import { getTargetConfig } from "../get-target-config";
import * as checkTerraformSkip from "../check-terraform-skip";
import { main as runPlan } from "./run";
import { create as createCommit } from "../commit";

export const main = async () => {
  // Step 1: Get target config
  const config = lib.getConfig();
  const targetConfig = await getTargetConfig(
    {
      target: lib.getTargetFromEnv(),
      workingDir: lib.getWorkingDirFromEnv(),
      isApply: lib.getIsApply(),
      jobType: lib.getJobType(),
    },
    config,
  );

  const jobType = env.tfactionJobType;
  const driftIssueNumber = env.tfactionDriftIssueNumber;

  let skipTerraform = false;
  if (jobType === "terraform" && !driftIssueNumber) {
    await checkTerraformSkip.main();
    skipTerraform = env.tfactionSkipTerraform;
  }
  core.setOutput("skipped", skipTerraform);

  // Step 4: Run plan if not skipped
  if (!skipTerraform) {
    await runPlan(targetConfig);

    // Step 5: Commit .tfmigrate.hcl if changed (for tfmigrate job type)
    if (jobType === "tfmigrate") {
      const workingDir = targetConfig.working_directory;
      if (workingDir) {
        const tfmigrateHclPath = `${workingDir}/.tfmigrate.hcl`;
        const githubToken = core.getInput("github_token");
        const securefixAppId = core.getInput("securefix_action_app_id") || "";
        const securefixAppPrivateKey =
          core.getInput("securefix_action_app_private_key") || "";
        const serverRepository =
          config.securefix_action?.server_repository ?? "";

        if (fs.existsSync(tfmigrateHclPath)) {
          // If the file is new or modified, commit it
          if (await git.hasFileChangedPorcelain(tfmigrateHclPath)) {
            core.info("Committing .tfmigrate.hcl");
            await createCommit({
              commitMessage: "chore(tfmigrate): add .tfmigrate.hcl",
              githubToken,
              files: new Set([tfmigrateHclPath]),
              serverRepository,
              appId: securefixAppId,
              appPrivateKey: securefixAppPrivateKey,
            });
          }
        }
      }
    }
  }
};
