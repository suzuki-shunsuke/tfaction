import * as fs from 'fs';
import * as core from '@actions/core';

const yaml = require('js-yaml');

interface Config {
  targets: Array<TargetConfig>
}

interface TargetConfig {
  target: string
  working_directory: string
  aws_region: string
  s3_bucket_name_plan_file: string
  s3_bucket_name_tfmigrate_history: string
  template_dir: string
  gcs_bucket_name_plan_file: string

  aws_assume_role_arn: string | undefined
  gcp_service_account: string | undefined
  gcp_workload_identity_provider: string | undefined
  environment: object | string | undefined
  secrets: object | undefined
  runs_on: string | undefined

  terraform_plan_config: JobConfig | undefined
  tfmigrate_plan_config: JobConfig | undefined
  terraform_apply_config: JobConfig | undefined
  tfmigrate_apply_config: JobConfig | undefined
}

export interface JobConfig {
  aws_assume_role_arn: string | undefined
  gcp_service_account: string | undefined
  gcp_workload_identity_provider: string | undefined
  environment: object | string | undefined
  secrets: object | undefined
  runs_on: string | undefined
}

export function getConfig(): Config {
  let configFilePath = process.env.TFACTION_CONFIG;
  if (configFilePath == '' || configFilePath == undefined) {
    configFilePath = 'tfaction-root.yaml';
  }
  return yaml.load(fs.readFileSync(configFilePath, 'utf8'));
}

export function getTarget(): string {
  const target = process.env.TFACTION_TARGET;
  if (target == '' || target == undefined) {
    throw 'the environment variable TFACTION_TARGET is required';
  }
  return target;
}

export function getIsApply(): boolean {
  return process.env.TFACTION_IS_APPLY == 'true'
}

export function getJobType(): string {
  if (process.env.TFACTION_JOB_TYPE == undefined) {
    throw 'environment variable TFACTION_JOB_TYPE is required';
  }
  return process.env.TFACTION_JOB_TYPE;
}

export function setValue(name: string, value: string, defaultValue: string) {
  core.setOutput(name, (value == '' || value == undefined) ? defaultValue : value);
}
