import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as lib from "../lib";
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

export const main = async () => {
  const result = await run(
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

export const run = async (
  inputs: Inputs,
  config: lib.Config,
): Promise<Result> => {
  const workingDirectoryFile = config.working_directory_file ?? "tfaction.yaml";

  const envs = new Map<string, any>();
  const outputs = new Map<string, any>();

  const t = await lib.getTargetGroup(config, inputs.target, inputs.workingDir);
  const workingDir = t.workingDir;
  const target = t.target;
  const targetConfig = t.group;

  envs.set("TFACTION_WORKING_DIR", workingDir);
  envs.set("TFACTION_TARGET", target);
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
  outputs.set("tflint_fix", config?.tflint?.fix ?? false);

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
        "aws_role_session_name",
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
    if (!outputs.has("aws_role_session_name")) {
      const prefix = `tfaction-${inputs.isApply ? "apply" : "plan"}`;
      const normalizedTarget = target.replaceAll("/", "_");
      const runID = process.env.GITHUB_RUN_ID ?? "";
      const names = [
        `${prefix}-${normalizedTarget}-${runID}`,
        `${prefix}-${normalizedTarget}`,
        `${prefix}-${runID}`,
        `${prefix}`,
      ];
      for (const name of names) {
        if (name.length > 64) {
          continue;
        }
        outputs.set("aws_role_session_name", name);
        break;
      }
    }

    outputs.set("destroy", wdConfig.destroy ? true : false);

    outputs.set(
      "enable_terraform_docs",
      wdConfig?.terraform_docs?.enabled ??
        config?.terraform_docs?.enabled ??
        false,
    );

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
