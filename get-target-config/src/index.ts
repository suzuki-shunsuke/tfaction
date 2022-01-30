import * as core from '@actions/core';
import * as lib from './lib';

try {
  const config = lib.getConfig();
  const target = lib.getTarget();
  const isApply = lib.getIsApply();
  const jobType = lib.getJobType();

  for (let i = 0; i < config.target_groups.length; i++) {
    const targetConfig = config.target_groups[i];
    if (!target.startsWith(targetConfig.target)) {
      continue;
    }

    core.setOutput('working_directory', target.replace(targetConfig.target, targetConfig.working_directory));
    core.setOutput('aws_region', targetConfig.aws_region);
    core.setOutput('s3_bucket_name_plan_file', targetConfig.s3_bucket_name_plan_file);
    core.setOutput('s3_bucket_name_tfmigrate_history', targetConfig.s3_bucket_name_tfmigrate_history);
    core.setOutput('template_dir', targetConfig.template_dir);
    core.setOutput('gcs_bucket_name_plan_file', targetConfig.gcs_bucket_name_plan_file);

    const jobConfig = lib.getJobConfig(targetConfig, isApply, jobType);

    if (jobConfig == undefined) {
      lib.setValue('aws_assume_role_arn', [targetConfig.aws_assume_role_arn]);
      lib.setValue('gcp_service_account', [targetConfig.gcp_service_account]);
      lib.setValue('gcp_workload_identity_provider', [targetConfig.gcp_workload_identity_provider]);
      lib.setValue('secrets', [targetConfig.secrets]);
      break;
    }
    lib.setValue('aws_assume_role_arn', [jobConfig.aws_assume_role_arn, targetConfig.aws_assume_role_arn]);
    lib.setValue('gcp_service_account', [jobConfig.gcp_service_account, targetConfig.gcp_service_account]);
    lib.setValue('gcp_workload_identity_provider', [jobConfig.gcp_workload_identity_provider, targetConfig.gcp_workload_identity_provider]);
    break;
  }
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
}
