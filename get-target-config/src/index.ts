import * as core from '@actions/core';
import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';

const yaml = require('js-yaml');

function getInput(name: string, envName: string): string {
  const value = core.getInput(name);
  if (value != '') {
    return value;
  }
  const valueEnv = process.env[envName];
  if (valueEnv === undefined || valueEnv == '') {
    return '';
  }
  return valueEnv;
}

function getBooleanInput(name: string, envName: string): boolean {
  const val = getInput(name, envName);
  if (['true', 'True', 'TRUE'].includes(val)) {
    return true;
  }
  if (['false', 'False', 'FALSE'].includes(val)) {
    return false;
  }
  throw 'boolean must be one of true, True, TRUE, false, False, and FALSE';
}

try {
  let configFilePath = getInput('config', 'TFACTION_CONFIG');
  if (configFilePath == '') {
    configFilePath = 'tfaction.yaml';
  }
  const config = yaml.load(fs.readFileSync(configFilePath, 'utf8'));

  const target = getInput('target', 'TFACTION_TARGET');
  if (target == '') {
    throw 'the input target or environment variable TFACTION_TARGET is required';
  }

  const isApply = getBooleanInput('is_apply', 'TFACTION_IS_APPLY');

  for (let i = 0; i < config.targets.length; i++) {
    const targetConfig = config.targets[i];
    if (!target.startsWith(targetConfig.target)) {
      continue;
    }
    core.setOutput('working_directory', target.replace(targetConfig.target, targetConfig.working_directory));
    core.setOutput('assume_role_arn', isApply ? targetConfig.assume_role_arns.terraform_apply : targetConfig.assume_role_arns.terraform_plan);
    core.setOutput('aws_region', targetConfig.aws_region);
    core.setOutput('s3_bucket_name_plan_file', targetConfig.s3_bucket_name_plan_file);
    core.setOutput('s3_bucket_name_tfmigrate_history', targetConfig.s3_bucket_name_tfmigrate_history);
    core.setOutput('template_dir', targetConfig.template_dir);
    break;
  }
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
}
