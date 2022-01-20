import * as core from '@actions/core';
import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';

const yaml = require('js-yaml');

function getConfig() {
  let configFilePath = process.env.TFACTION_CONFIG;
  if (configFilePath == '' || configFilePath == undefined) {
    configFilePath = 'tfaction.yaml';
  }
  return yaml.load(fs.readFileSync(configFilePath, 'utf8'));
}

function getTarget(): string {
  const target = process.env.TFACTION_TARGET;
  if (target == '' || target == undefined) {
    throw 'the environment variable TFACTION_TARGET is required';
  }
  return target;
}

function getIsApply(): boolean {
  return process.env.TFACTION_IS_APPLY == 'true'
}

try {
  const config = getConfig();
  const target = getTarget();
  const isApply = getIsApply();

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
