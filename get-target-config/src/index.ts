import * as core from '@actions/core';
import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import * as lib from './lib';

try {
  const config = lib.getConfig();
  const target = lib.getTarget();
  const isApply = lib.getIsApply();

  for (let i = 0; i < config.targets.length; i++) {
    const targetConfig = config.targets[i];
    if (!target.startsWith(targetConfig.target)) {
      continue;
    }
    if (targetConfig.aws_assume_role_arns != undefined) {
      core.setOutput('aws_assume_role_arn', isApply ? targetConfig.aws_assume_role_arns.terraform_apply : targetConfig.aws_assume_role_arns.terraform_plan);
    }
    core.setOutput('working_directory', target.replace(targetConfig.target, targetConfig.working_directory));
    core.setOutput('aws_region', targetConfig.aws_region);
    core.setOutput('s3_bucket_name_plan_file', targetConfig.s3_bucket_name_plan_file);
    core.setOutput('s3_bucket_name_tfmigrate_history', targetConfig.s3_bucket_name_tfmigrate_history);
    core.setOutput('template_dir', targetConfig.template_dir);
    core.setOutput('gcp_service_account', targetConfig.gcp_service_account);
    core.setOutput('gcp_workload_identity_provider', targetConfig.gcp_workload_identity_provider);
    core.setOutput('gcs_bucket_name_plan_file', targetConfig.gcs_bucket_name_plan_file);
    core.setOutput('runs_on', targetConfig.runs_on ? targetConfig.runs_on : 'ubuntu-latest');
    break;
  }
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
}
