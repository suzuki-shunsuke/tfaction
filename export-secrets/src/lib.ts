import * as fs from 'fs';
import * as core from '@actions/core';

const yaml = require('js-yaml');

export function getConfig() {
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

export function setValue(name: string, value: string, defaultValue: string) {
  core.setOutput(name, (value == '' || value == undefined) ? defaultValue : value);
}
