import * as fs from "fs";
import * as core from "@actions/core";

const yaml = require("js-yaml");

interface Config {
  target_groups: Array<TargetConfig>;
}

export interface TargetConfig {
  target: string;
  working_directory: string;
  aws_region: string;
  s3_bucket_name_tfmigrate_history: string;
  template_dir: string;
  gcs_bucket_name_plan_file: string;

  aws_assume_role_arn: string | undefined;
  gcp_service_account: string | undefined;
  gcp_workload_identity_provider: string | undefined;
  environment: object | string | undefined;
  secrets: object | undefined;
  runs_on: string | undefined;
  aws_secrets_manager: Array<AWSSecretsManagerSecret> | undefined;

  terraform_plan_config: JobConfig | undefined;
  tfmigrate_plan_config: JobConfig | undefined;
  terraform_apply_config: JobConfig | undefined;
  tfmigrate_apply_config: JobConfig | undefined;
}

export interface JobConfig {
  aws_assume_role_arn: string | undefined;
  gcp_service_account: string | undefined;
  gcp_workload_identity_provider: string | undefined;
  environment: object | string | undefined;
  secrets: object | undefined;
  runs_on: string | undefined;
  aws_secrets_manager: Array<AWSSecretsManagerSecret> | undefined;
}

interface AWSSecretsManagerSecretEnv {
  env_name: string;
  secret_key: string | undefined;
}

export interface AWSSecretsManagerSecret {
  envs: Array<AWSSecretsManagerSecretEnv>;

  secret_id: string;
  version_id: string | undefined;
  version_stage: string | undefined;
  aws_region: string | undefined;
}

export function getConfig(): Config {
  let configFilePath = process.env.TFACTION_CONFIG;
  if (configFilePath == "" || configFilePath == undefined) {
    configFilePath = "tfaction-root.yaml";
  }
  return yaml.load(fs.readFileSync(configFilePath, "utf8"));
}

export function getTarget(): string {
  const target = process.env.TFACTION_TARGET;
  if (target == "" || target == undefined) {
    throw "the environment variable TFACTION_TARGET is required";
  }
  return target;
}

export function getIsApply(): boolean {
  return process.env.TFACTION_IS_APPLY == "true";
}

export function getJobType(): string {
  if (process.env.TFACTION_JOB_TYPE == undefined) {
    throw "environment variable TFACTION_JOB_TYPE is required";
  }
  return process.env.TFACTION_JOB_TYPE;
}

export function getJobConfig(
  config: TargetConfig,
  isApply: boolean,
  jobType: string,
): JobConfig | undefined {
  if (isApply) {
    switch (jobType) {
      case "terraform":
        return config.terraform_apply_config;
      case "tfmigrate":
        return config.tfmigrate_apply_config;
      default:
        throw `unknown type: ${jobType}`;
    }
  }
  switch (jobType) {
    case "terraform":
      return config.terraform_plan_config;
    case "tfmigrate":
      return config.tfmigrate_plan_config;
    default:
      throw `unknown type: ${jobType}`;
  }
}

export function setValue(name: string, values: Array<any>) {
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (value != undefined) {
      core.setOutput(name, value);
      return;
    }
  }
}

interface TargetSecret {
  secrets: Map<string, string>;
}

export function getTargetConfig(
  targets: Array<TargetConfig>,
  target: string,
): TargetConfig {
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    if (target.startsWith(t.target)) {
      return t;
    }
  }
  throw "target is invalid";
}

export function getSecrets(
  targetConfig: TargetConfig,
  jobConfig: JobConfig | undefined,
): Map<string, string> {
  const targetSecrets = targetConfig.secrets;
  const secrets = new Map<string, string>();
  if (targetSecrets != undefined) {
    for (let [k, v] of Object.entries(targetSecrets)) {
      secrets.set(k, v);
    }
  }

  if (jobConfig != undefined && jobConfig.secrets != undefined) {
    for (let [k, v] of Object.entries(jobConfig.secrets)) {
      secrets.set(k, v);
    }
  }
  return secrets;
}
