import * as fs from 'fs';

const yaml = require('js-yaml');

interface Config {
  renovate_login: string | undefined
  skip_terraform_by_renovate: boolean | undefined
  renovate_terraform_labels: Array<string> | undefined
}

export function getConfig(): Config {
  let configFilePath = process.env.TFACTION_CONFIG;
  if (configFilePath == '' || configFilePath == undefined) {
    configFilePath = 'tfaction-root.yaml';
  }
  return yaml.load(fs.readFileSync(configFilePath, 'utf8'));
}
