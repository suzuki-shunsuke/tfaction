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

  aws_assume_role_arn: string | undefined;
  gcp_service_account: string | undefined;
  gcp_workload_identity_provider: string | undefined;
  environment: object | string | undefined;
  secrets: Array<Secret> | undefined;
  runs_on: string | undefined;

  terraform_plan_config: JobConfig | undefined;
  tfmigrate_plan_config: JobConfig | undefined;
  terraform_apply_config: JobConfig | undefined;
  tfmigrate_apply_config: JobConfig | undefined;
}

export interface Secret {
  env_name: string | undefined;
  secret_name: string | undefined;
}

export interface JobConfig {
  aws_assume_role_arn: string | undefined;
  gcp_service_account: string | undefined;
  gcp_workload_identity_provider: string | undefined;
  environment: object | string | undefined;
  secrets: Array<Secret> | undefined;
  runs_on: string | undefined;
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
    throw new Error("the environment variable TFACTION_TARGET is required");
  }
  return target;
}

export function getIsApply(): boolean {
  return process.env.TFACTION_IS_APPLY == "true";
}

export function getJobType(): string {
  if (process.env.TFACTION_JOB_TYPE == undefined) {
    throw new Error("environment variable TFACTION_JOB_TYPE is required");
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
        throw new Error(`unknown type: ${jobType}`);
    }
  }
  switch (jobType) {
    case "terraform":
      return config.terraform_plan_config;
    case "tfmigrate":
      return config.tfmigrate_plan_config;
    default:
      throw new Error(`unknown type: ${jobType}`);
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
  throw new Error("target is invalid");
}

function setSecretToMap(secrets: Array<Secret>, m: Map<string, string>) {
  for (let i = 0; i < secrets.length; i++) {
    const secret = secrets[i];
    if (secret.env_name) {
      if (secret.secret_name) {
        m.set(secret.env_name, secret.secret_name);
      } else {
        m.set(secret.env_name, secret.env_name);
      }
    } else {
      if (secret.secret_name) {
        m.set(secret.secret_name, secret.secret_name);
      } else {
        throw new Error("either secret_name or env_name is required");
      }
    }
  }
}

export function getSecrets(
  targetConfig: TargetConfig,
  jobConfig: JobConfig | undefined,
): Map<string, string> {
  const targetSecrets = targetConfig.secrets;
  const secrets = new Map<string, string>();
  if (targetSecrets != undefined) {
    setSecretToMap(targetSecrets, secrets);
  }

  if (jobConfig != undefined && jobConfig.secrets != undefined) {
    setSecretToMap(jobConfig.secrets, secrets);
  }
  return secrets;
}
