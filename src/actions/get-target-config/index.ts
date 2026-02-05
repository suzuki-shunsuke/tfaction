import * as core from "@actions/core";
import * as lib from "../../lib";
import * as types from "../../lib/types";
import * as env from "../../lib/env";
import * as path from "path";

type Inputs = {
  target?: string;
  workingDir?: string;
  isApply: boolean;
  jobType: types.JobType;
};

export type Result = {
  envs: Map<string, string | boolean>;
  outputs: Map<string, string | boolean>;
};

export interface TargetConfig {
  // Always set
  working_directory: string;
  target: string;
  providers_lock_opts: string;
  enable_tflint: boolean;
  enable_trivy: boolean;
  tflint_fix: boolean;
  terraform_command: string;

  // Optional (may not be set depending on config)
  template_dir?: string;
  aws_region?: string;
  aws_assume_role_arn?: string;
  aws_role_session_name?: string;
  gcp_service_account?: string;
  gcp_workload_identity_provider?: string;
  gcp_access_token_scopes?: string;
  gcp_remote_backend_service_account?: string;
  gcp_remote_backend_workload_identity_provider?: string;
  s3_bucket_name_tfmigrate_history?: string;
  gcs_bucket_name_tfmigrate_history?: string;

  // Only for non-scaffold_working_dir job types
  destroy?: boolean;
  enable_terraform_docs?: boolean;
  accept_change_by_renovate?: boolean;

  // Additional envs from config (dynamic)
  env?: Record<string, string>;
}

export const getTargetConfig = async (
  inputs: Inputs,
  config: types.Config,
): Promise<TargetConfig> => {
  const workingDirectoryFile = config.working_directory_file;

  const t = await lib.getTargetGroup(config, inputs.target, inputs.workingDir);
  const workingDir = t.workingDir;
  const target = t.target;
  const targetGroup = t.group;

  const result: TargetConfig = {
    working_directory: t.workingDir,
    target: target,
    providers_lock_opts:
      "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
    enable_tflint: config.tflint.enabled,
    enable_trivy: config.trivy.enabled,
    tflint_fix: config.tflint.fix,
    terraform_command: config.terraform_command,
    template_dir: targetGroup?.template_dir,
  };

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
      [targetGroup],
    );
    result.s3_bucket_name_tfmigrate_history = m.get(
      "s3_bucket_name_tfmigrate_history",
    );
    result.gcs_bucket_name_tfmigrate_history = m.get(
      "gcs_bucket_name_tfmigrate_history",
    );
    result.aws_region = m.get("aws_region");
    result.aws_assume_role_arn = m.get("aws_assume_role_arn");
    result.gcp_service_account = m.get("gcp_service_account");
    result.gcp_workload_identity_provider = m.get(
      "gcp_workload_identity_provider",
    );
    result.gcp_access_token_scopes = m.get("gcp_access_token_scopes");
    result.gcp_remote_backend_service_account = m.get(
      "gcp_remote_backend_service_account",
    );
    result.gcp_remote_backend_workload_identity_provider = m.get(
      "gcp_remote_backend_workload_identity_provider",
    );
  } else {
    const rootJobConfig = lib.getJobConfig(
      targetGroup,
      inputs.isApply,
      inputs.jobType,
    );

    const wdConfig = lib.readTargetConfig(
      path.join(config.git_root_dir, workingDir, workingDirectoryFile),
    );
    const jobConfig = lib.getJobConfig(
      wdConfig,
      inputs.isApply,
      inputs.jobType,
    );

    // Override with values from wdConfig, targetGroup, config
    const m1 = lib.setOutputs(
      [
        "s3_bucket_name_tfmigrate_history",
        "gcs_bucket_name_tfmigrate_history",
        "providers_lock_opts",
        "terraform_command",
      ],
      [wdConfig, targetGroup, config],
    );
    result.s3_bucket_name_tfmigrate_history = m1.get(
      "s3_bucket_name_tfmigrate_history",
    );
    result.gcs_bucket_name_tfmigrate_history = m1.get(
      "gcs_bucket_name_tfmigrate_history",
    );
    result.providers_lock_opts =
      m1.get("providers_lock_opts") ?? result.providers_lock_opts;
    result.terraform_command =
      m1.get("terraform_command") ?? result.terraform_command;

    // AWS/GCP settings with priority: jobConfig, wdConfig, rootJobConfig, targetGroup, config
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
      [jobConfig, wdConfig, rootJobConfig, targetGroup, config],
    );
    result.aws_region = m2.get("aws_region");
    result.aws_assume_role_arn = m2.get("aws_assume_role_arn");
    result.aws_role_session_name = m2.get("aws_role_session_name");
    result.gcp_service_account = m2.get("gcp_service_account");
    result.gcp_workload_identity_provider = m2.get(
      "gcp_workload_identity_provider",
    );
    result.gcp_access_token_scopes = m2.get("gcp_access_token_scopes");
    result.gcp_remote_backend_service_account = m2.get(
      "gcp_remote_backend_service_account",
    );
    result.gcp_remote_backend_workload_identity_provider = m2.get(
      "gcp_remote_backend_workload_identity_provider",
    );

    // Auto-generate aws_role_session_name if not set
    if (result.aws_role_session_name === undefined) {
      const prefix = `tfaction-${inputs.isApply ? "apply" : "plan"}`;
      const normalizedTarget = target.replaceAll("/", "_");
      const runID = env.all.GITHUB_RUN_ID;
      const names = [
        `${prefix}-${normalizedTarget}-${runID}`,
        `${prefix}-${normalizedTarget}`,
        `${prefix}-${runID}`,
        `${prefix}`,
      ];
      for (const name of names) {
        if (name.length <= 64) {
          result.aws_role_session_name = name;
          break;
        }
      }
    }

    result.destroy = wdConfig.destroy ? true : false;
    result.accept_change_by_renovate = wdConfig.accept_change_by_renovate;
    result.enable_terraform_docs =
      wdConfig?.terraform_docs?.enabled ??
      config?.terraform_docs?.enabled ??
      false;

    // Collect envs
    const envMap = lib.setEnvs(
      config,
      targetGroup,
      rootJobConfig,
      wdConfig,
      jobConfig,
    );
    if (envMap.size > 0) {
      const env: Record<string, string> = {};
      for (const [key, value] of envMap) {
        env[key] = value;
      }
      result.env = env;
    }
  }

  return result;
};

export const main = async () => {
  const result = await run(
    {
      target: env.all.TFACTION_TARGET,
      workingDir: env.all.TFACTION_WORKING_DIR,
      isApply: env.isApply,
      jobType: lib.getJobType(),
    },
    await lib.getConfig(),
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
  config: types.Config,
): Promise<Result> => {
  const targetConfig = await getTargetConfig(inputs, config);

  const envs = new Map<string, string | boolean>();
  envs.set("TFACTION_WORKING_DIR", targetConfig.working_directory);
  envs.set("TFACTION_TARGET", targetConfig.target);
  if (targetConfig.env) {
    for (const [key, value] of Object.entries(targetConfig.env)) {
      envs.set(key, value);
    }
  }

  const outputs = new Map<string, string | boolean>();
  for (const [key, value] of Object.entries(targetConfig)) {
    if (key !== "env" && key !== "target" && value !== undefined) {
      outputs.set(key, value);
    }
  }

  return { envs, outputs };
};
