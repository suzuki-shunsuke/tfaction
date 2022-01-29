import * as core from '@actions/core';
import * as lib from './lib';

interface TargetConfig {
  terraform_plan_config: lib.JobConfig | undefined
  tfmigrate_plan_config: lib.JobConfig | undefined
  terraform_apply_config: lib.JobConfig | undefined
  tfmigrate_apply_config: lib.JobConfig | undefined
}

function getJobConfig(config: TargetConfig, isApply: boolean, jobType: string): lib.JobConfig | undefined {
  if (isApply) {
    switch (jobType) {
      case 'terraform':
        return config.terraform_apply_config;
      case 'tfmigrate':
        return config.tfmigrate_apply_config;
      default:
        throw `unknown type: ${jobType}`;
    }
  }
  switch (jobType) {
    case 'terraform':
      return config.terraform_plan_config;
    case 'tfmigrate':
      return config.tfmigrate_plan_config;
    default:
      throw `unknown type: ${jobType}`;
  }
}

function setValue(name: string, values: Array<any>) {
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (value != undefined) {
      core.setOutput(name, value);
      return;
    }
  }
}

try {
  const config = lib.getConfig();
  const target = lib.getTarget();
  const isApply = lib.getIsApply();
  const jobType = lib.getJobType();

  for (let i = 0; i < config.targets.length; i++) {
    const targetConfig = config.targets[i];
    if (!target.startsWith(targetConfig.target)) {
      continue;
    }

    core.setOutput('working_directory', target.replace(targetConfig.target, targetConfig.working_directory));
    core.setOutput('aws_region', targetConfig.aws_region);
    core.setOutput('s3_bucket_name_plan_file', targetConfig.s3_bucket_name_plan_file);
    core.setOutput('s3_bucket_name_tfmigrate_history', targetConfig.s3_bucket_name_tfmigrate_history);
    core.setOutput('template_dir', targetConfig.template_dir);
    core.setOutput('gcs_bucket_name_plan_file', targetConfig.gcs_bucket_name_plan_file);

    const jobConfig = getJobConfig(targetConfig, isApply, jobType);

    if (jobConfig == undefined) {
      setValue('aws_assume_role_arn', [targetConfig.aws_assume_role_arn]);
      setValue('gcp_service_account', [targetConfig.gcp_service_account]);
      setValue('gcp_workload_identity_provider', [targetConfig.gcp_workload_identity_provider]);
      setValue('secrets', [targetConfig.secrets]);
      setValue('environment', [targetConfig.environment]);
      setValue('runs_on', [targetConfig.runs_on]);
      break;
    }
    setValue('aws_assume_role_arn', [jobConfig.aws_assume_role_arn, targetConfig.aws_assume_role_arn]);
    setValue('gcp_service_account', [jobConfig.gcp_service_account, targetConfig.gcp_service_account]);
    setValue('gcp_workload_identity_provider', [jobConfig.gcp_workload_identity_provider, targetConfig.gcp_workload_identity_provider]);
    setValue('secrets', [jobConfig.secrets, targetConfig.secrets]);
    setValue('environment', [jobConfig.environment, targetConfig.environment]);
    setValue('runs_on', [jobConfig.runs_on, targetConfig.runs_on]);
    break;
  }
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
}
