import * as core from '@actions/core';
import * as fs from 'fs';

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

try {
  let configFilePath = getInput('config', 'TFACTION_CONFIG');
  if (configFilePath == '') {
    configFilePath = 'tfaction.yaml';
  }
  const config = yaml.load(fs.readFileSync(configFilePath, 'utf8'));

  core.setOutput('renovate_login', config.renovate_login)
  core.setOutput('label_prefix_target', config.label_prefixes.target)
  core.setOutput('label_prefix_tfmigrate', config.label_prefixes.tfmigrate)
  core.setOutput('label_prefix_ignore', config.label_prefixes.ignore)
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
}
