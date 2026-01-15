import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";

import * as lib from "../lib";
import * as env from "../lib/env";
import * as input from "../lib/input";
import * as git from "../lib/git";
import { getTargetConfig } from "../get-target-config";
import * as checkTerraformSkip from "../check-terraform-skip";
import { main as runPlan } from "./run";
import { create as createCommit } from "../commit";

export const main = async () => {
  // Step 1: Get target config
  const config = await lib.getConfig();
  const targetConfig = await getTargetConfig(
    {
      target: env.tfactionTarget,
      workingDir: env.tfactionWorkingDir,
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
        const tfmigrateHclPath = path.join(
          config.workspace,
          config.config_dir,
          workingDir,
          ".tfmigrate.hcl",
        );
        const serverRepository =
          config.securefix_action?.server_repository ?? "";

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
              appId: input.securefixActionAppId,
              appPrivateKey: input.securefixActionAppPrivateKey,
            });
          }
        }
      }
    }
  }
};
