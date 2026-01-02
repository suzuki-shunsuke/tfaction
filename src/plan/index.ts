import * as core from "@actions/core";
import * as fs from "fs";
import * as exec from "@actions/exec";

import * as lib from "../lib";
import * as getTargetConfig from "../get-target-config";
import * as getGlobalConfig from "../get-global-config";
import * as checkTerraformSkip from "../check-terraform-skip";
import { main as runPlan } from "./run";
import { create as createCommit } from "../commit";

export const main = async () => {
  // Step 1: Get target config
  const config = lib.getConfig();
  const targetConfigResult = await getTargetConfig.run(
    {
      target: process.env.TFACTION_TARGET,
      workingDir: process.env.TFACTION_WORKING_DIR,
      isApply: lib.getIsApply(),
      jobType: lib.getJobType(),
    },
    config,
  );
  // Export envs and set outputs from target config
  for (const [key, value] of targetConfigResult.envs) {
    core.exportVariable(key, value);
  }
  for (const [key, value] of targetConfigResult.outputs) {
    core.setOutput(key, value);
  }

  // Step 2: Get global config
  await getGlobalConfig.main();

  // Step 3: Check terraform skip (only for terraform job type without drift issue)
  const jobType = process.env.TFACTION_JOB_TYPE;
  const driftIssueNumber = process.env.TFACTION_DRIFT_ISSUE_NUMBER;

  let skipTerraform = false;
  if (jobType === "terraform" && !driftIssueNumber) {
    await checkTerraformSkip.main();
    skipTerraform = process.env.TFACTION_SKIP_TERRAFORM === "true";
  }
  core.setOutput("skipped", skipTerraform);

  // Step 4: Run plan if not skipped
  if (!skipTerraform) {
    await runPlan();

    // Step 5: Commit .tfmigrate.hcl if changed (for tfmigrate job type)
    if (jobType === "tfmigrate") {
      const workingDir = targetConfigResult.outputs.get("working_directory");
      if (workingDir) {
        const tfmigrateHclPath = `${workingDir}/.tfmigrate.hcl`;
        const githubToken = core.getInput("github_token");
        const securefixAppId = core.getInput("securefix_action_app_id") || "";
        const securefixAppPrivateKey =
          core.getInput("securefix_action_app_private_key") || "";
        const serverRepository =
          config.securefix_action?.server_repository ?? "";

        if (fs.existsSync(tfmigrateHclPath)) {
          // Use git to check if the file is new or modified
          let gitOutput = "";
          await exec.exec("git", ["status", "--porcelain", tfmigrateHclPath], {
            listeners: {
              stdout: (data: Buffer) => {
                gitOutput += data.toString();
              },
            },
          });

          // If the file is new or modified, commit it
          if (gitOutput.trim().length > 0) {
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
