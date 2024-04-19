import * as core from "@actions/core";
import * as lib from "lib";
import * as path from "path";

type Inputs = {
  target?: string;
  workingDir?: string;
  isApply: boolean;
  jobType: lib.JobType;
};

export type Result = {
  envs: Map<string, any>;
  outputs: Map<string, any>;
};

export const main = () => {
  const result = run(
    {
      target: process.env.TFACTION_TARGET,
      workingDir: process.env.TFACTION_WORKING_DIR,
      isApply: lib.getIsApply(),
      jobType: lib.getJobType(),
    },
    lib.getConfig(),
  );
  for (const [key, value] of result.envs) {
    core.exportVariable(key, value);
  }
  for (const [key, value] of result.outputs) {
    core.setOutput(key, value);
  }
};

export const run = (inputs: Inputs, config: lib.Config): Result => {
  const workingDirectoryFile = config.working_directory_file ?? "tfaction.yaml";

  const envs = new Map<string, any>();
  const outputs = new Map<string, any>();

  let target = inputs.target;
  let workingDir = inputs.workingDir;
  let targetConfig = null;

  if (target) {
    targetConfig = lib.getTargetFromTargetGroups(config.target_groups, target);
    if (!targetConfig) {
      throw new Error("target config is not found in target_groups");
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
      throw new Error("target config is not found in target_groups");
    }
    target = workingDir.replace(
      targetConfig.working_directory,
      targetConfig.target,
    );
    envs.set("TFACTION_TARGET", target);
  } else {
    throw new Error(
      "Either TFACTION_TARGET or TFACTION_WORKING_DIR is required",
    );
  }

  outputs.set("working_directory", workingDir);
  outputs.set(
    "providers_lock_opts",
    "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
  );
  for (const [key, value] of lib.setOutputs(["template_dir"], [targetConfig])) {
    outputs.set(key, value);
  }

  outputs.set("enable_tfsec", config?.tfsec?.enabled ?? false);
  outputs.set("enable_tflint", config?.tflint?.enabled ?? true);
  outputs.set("enable_trivy", config?.trivy?.enabled ?? true);

  outputs.set("terraform_command", "terraform");

  if (inputs.jobType === "scaffold_working_dir") {
    const m = lib.setOutputs(
      [
        "s3_bucket_name_tfmigrate_history",
        "gcs_bucket_name_tfmigrate_history",
        "aws_region",
        "aws_assume_role_arn",
        "gcp_service_account",
        "gcp_workload_identity_provider",
        "gcp_access_token_scopes",
        "gcp_remote_backend_service_account",
        "gcp_remote_backend_workload_identity_provider",
      ],
      [targetConfig],
    );
    for (const [key, value] of m) {
      outputs.set(key, value);
    }
  } else {
    const rootJobConfig = lib.getJobConfig(
      targetConfig,
      inputs.isApply,
      inputs.jobType,
    );

    const wdConfig = lib.readTargetConfig(
      path.join(workingDir, workingDirectoryFile),
    );
    const jobConfig = lib.getJobConfig(
      wdConfig,
      inputs.isApply,
      inputs.jobType,
    );

    const m1 = lib.setOutputs(
      [
        "s3_bucket_name_tfmigrate_history",
        "gcs_bucket_name_tfmigrate_history",
        "providers_lock_opts",
        "terraform_command",
      ],
      [wdConfig, targetConfig, config],
    );
    for (const [key, value] of m1) {
      outputs.set(key, value);
    }

    const m2 = lib.setOutputs(
      [
        "aws_region",
        "aws_assume_role_arn",
        "gcp_service_account",
        "gcp_workload_identity_provider",
        "gcp_access_token_scopes",
        "gcp_remote_backend_service_account",
        "gcp_remote_backend_workload_identity_provider",
      ],
      [jobConfig, wdConfig, rootJobConfig, targetConfig, config],
    );
    for (const [key, value] of m2) {
      outputs.set(key, value);
    }

    outputs.set("destroy", wdConfig.destroy ? true : false);

    const m3 = lib.setEnvs(
      config,
      targetConfig,
      rootJobConfig,
      wdConfig,
      jobConfig,
    );
    for (const [key, value] of m3) {
      envs.set(key, value);
    }
  }

  return {
    outputs: outputs,
    envs: envs,
  };
};
