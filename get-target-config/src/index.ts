import * as core from '@actions/core';
import * as lib from './lib';
import * as path from 'path';

try {
  const config = lib.getConfig();
  const isApply = lib.getIsApply();
  const jobType = lib.getJobType();
  const workingDirectoryFile = config.working_directory_file ? config.working_directory_file : 'tfaction.yaml';

  let target = process.env.TFACTION_TARGET;
  let workingDir = process.env.TFACTION_WORKING_DIR;
  let targetConfig = null;

  if (target) {
    targetConfig = lib.getTargetFromTargetGroups(config.target_groups, target);
    if (targetConfig === null) {
      throw 'target config is not found in target_groups';
    }
    workingDir = target.replace(targetConfig.target, targetConfig.working_directory);
  } else if (workingDir) {
    targetConfig = lib.getTargetFromTargetGroupsByWorkingDir(config.target_groups, workingDir);
    if (targetConfig === null) {
      throw 'target config is not found in target_groups';
    }
    target = workingDir.replace(targetConfig.working_directory, targetConfig.target);
    core.exportVariable('TFACTION_TARGET', target);
  } else {
    throw 'Either TFACTION_TARGET or TFACTION_WORKING_DIR is required';
  }

  core.setOutput('working_directory', workingDir);
  core.setOutput('providers_lock_opts', '-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64');
  lib.setOutputs(['template_dir'], [targetConfig]);

  core.setOutput('enable_tfsec', getBool(config, false, 'tfsec', 'enabled'));
  core.setOutput('enable_tflint', getBool(config, true, 'tflint', 'enabled'));
  core.setOutput('enable_trivy', getBool(config, true, 'trivy', 'enabled'));

  if (jobType == 'scaffold_working_dir') {
    lib.setOutputs([
      's3_bucket_name_tfmigrate_history',
      'gcs_bucket_name_tfmigrate_history',
      'aws_region',
      'aws_assume_role_arn',
      'gcp_service_account',
      'gcp_workload_identity_provider',
    ], [targetConfig]);
  } else {
    const rootJobConfig = lib.getJobConfig(targetConfig, isApply, jobType);

    const wdConfig = lib.readTargetConfig(path.join(workingDir, workingDirectoryFile));
    const jobConfig = lib.getJobConfig(wdConfig, isApply, jobType);
    lib.setOutputs([
      's3_bucket_name_tfmigrate_history',
      'gcs_bucket_name_tfmigrate_history',
      'providers_lock_opts',
    ], [wdConfig, targetConfig, config]);
    lib.setOutputs([
      'aws_region',
      'aws_assume_role_arn',
      'gcp_service_account',
      'gcp_workload_identity_provider',
    ], [jobConfig, wdConfig, rootJobConfig, targetConfig, config]);
    core.setOutput('destroy', wdConfig.destroy ? true : false);
    lib.setEnvs(config, targetConfig, rootJobConfig, wdConfig, jobConfig);
  }
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
}

function getBool(a: any, defaultValue: boolean, ...keys: string[]): boolean {
  try {
    let value = a;
    for (let i = 0; i < keys.length; i++) {
      value = value[keys[i]];
    }
    if (value === undefined) {
      return defaultValue;
    }
    return value === true;
  } catch (_error) {
    return defaultValue;
  }
}
