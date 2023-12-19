import * as core from "@actions/core";
import * as lib from "lib";
import * as path from "path";

type Inputs = {
  target?: string;
  workingDir?: string;
};

try {
  const inputs: Inputs = {
    target: process.env.TFACTION_TARGET,
    workingDir: process.env.TFACTION_WORKING_DIR,
  };
  const config = lib.getConfig();
  const isApply = lib.getIsApply();
  const jobType = lib.getJobType();
  const workingDirectoryFile = config.working_directory_file
    ? config.working_directory_file
    : "tfaction.yaml";

  let target = inputs.target;
  let workingDir = inputs.workingDir;
  let targetConfig = null;

  if (target) {
    targetConfig = lib.getTargetFromTargetGroups(config.target_groups, target);
    if (!targetConfig) {
      throw "target config is not found in target_groups";
    }
    workingDir = target.replace(
      targetConfig.target,
      targetConfig.working_directory,
    );
  } else if (workingDir) {
    targetConfig = lib.getTargetFromTargetGroupsByWorkingDir(
      config.target_groups,
      workingDir,
    );
    if (!targetConfig) {
      throw "target config is not found in target_groups";
    }
    target = workingDir.replace(
      targetConfig.working_directory,
      targetConfig.target,
    );
    core.exportVariable("TFACTION_TARGET", target);
  } else {
    throw "Either TFACTION_TARGET or TFACTION_WORKING_DIR is required";
  }

  core.setOutput("working_directory", workingDir);
  core.setOutput(
    "providers_lock_opts",
    "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
  );
  lib.setOutputs(["template_dir"], [targetConfig]);

  core.setOutput("enable_tfsec", config?.tfsec?.enabled ?? false);
  core.setOutput("enable_tflint", config?.tflint?.enabled ?? true);
  core.setOutput("enable_trivy", config?.trivy?.enabled ?? true);

  if (jobType === "scaffold_working_dir") {
    lib.setOutputs(
      [
        "s3_bucket_name_tfmigrate_history",
        "gcs_bucket_name_tfmigrate_history",
        "aws_region",
        "aws_assume_role_arn",
        "gcp_service_account",
        "gcp_workload_identity_provider",
      ],
      [targetConfig],
    );
  } else {
    const rootJobConfig = lib.getJobConfig(targetConfig, isApply, jobType);

    const wdConfig = lib.readTargetConfig(
      path.join(workingDir, workingDirectoryFile),
    );
    const jobConfig = lib.getJobConfig(wdConfig, isApply, jobType);
    lib.setOutputs(
      [
        "s3_bucket_name_tfmigrate_history",
        "gcs_bucket_name_tfmigrate_history",
        "providers_lock_opts",
      ],
      [wdConfig, targetConfig, config],
    );
    lib.setOutputs(
      [
        "aws_region",
        "aws_assume_role_arn",
        "gcp_service_account",
        "gcp_workload_identity_provider",
      ],
      [jobConfig, wdConfig, rootJobConfig, targetConfig, config],
    );
    core.setOutput("destroy", wdConfig.destroy ? true : false);
    lib.setEnvs(config, targetConfig, rootJobConfig, wdConfig, jobConfig);
  }
} catch (error) {
  core.setFailed(
    error instanceof Error ? error.message : JSON.stringify(error),
  );
}
