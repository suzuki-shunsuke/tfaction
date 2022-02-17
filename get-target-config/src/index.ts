import * as core from '@actions/core';
import * as lib from './lib';
import * as path from 'path';

try {
  const config = lib.getConfig();
  const target = lib.getTarget();
  const isApply = lib.getIsApply();
  const jobType = lib.getJobType();

  const workingDirectoryFile = config.working_directory_file ? config.working_directory_file : 'tfaction.yaml';

  for (let i = 0; i < config.target_groups.length; i++) {
    const targetConfig = config.target_groups[i];
    if (!target.startsWith(targetConfig.target)) {
      continue;
    }

    const workingDir = target.replace(targetConfig.target, targetConfig.working_directory);
    core.setOutput('working_directory', workingDir);
    core.setOutput('providers_lock_opts', '-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64');
    lib.setOutputs(['template_dir'], [targetConfig]);

    if (jobType == 'scaffold_working_dir') {
      lib.setOutputs([
        's3_bucket_name_plan_file',
        's3_bucket_name_tfmigrate_history',
        'gcs_bucket_name_plan_file',
        'aws_region',
        'aws_assume_role_arn',
        'gcp_service_account',
        'gcp_workload_identity_provider',
      ], [targetConfig]);
      break;
    }

    const rootJobConfig = lib.getJobConfig(targetConfig, isApply, jobType);

    const wdConfig = lib.readTargetConfig(path.join(workingDir, workingDirectoryFile));
    const jobConfig = lib.getJobConfig(wdConfig, isApply, jobType);
    lib.setOutputs([
      's3_bucket_name_plan_file',
      's3_bucket_name_tfmigrate_history',
      'gcs_bucket_name_plan_file',
      'providers_lock_opts',
    ], [wdConfig, targetConfig, config]);
    lib.setOutputs([
      'aws_region',
      'aws_assume_role_arn',
      'gcp_service_account',
      'gcp_workload_identity_provider',
    ], [jobConfig, wdConfig, rootJobConfig, targetConfig, config]);
    break;
  }
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
}
