import * as core from '@actions/core';
import * as fs from 'fs';

const yaml = require('js-yaml');

function getConfig() {
  let configFilePath = process.env.TFACTION_CONFIG;
  if (configFilePath == '' || configFilePath == undefined) {
    configFilePath = 'tfaction.yaml';
  }
  return yaml.load(fs.readFileSync(configFilePath, 'utf8'));
}

try {
  const config = getConfig();
  core.setOutput('base_working_directory', config.base_working_directory);
  core.setOutput('working_directory_file', config.working_directory_file);
  core.setOutput('renovate_login', config.renovate_login);
  if (config.label_prefixes != undefined) {
    core.setOutput('label_prefix_target', config.label_prefixes.target);
    core.setOutput('label_prefix_tfmigrate', config.label_prefixes.tfmigrate);
    core.setOutput('label_prefix_ignore', config.label_prefixes.ignore);
  }
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
}
