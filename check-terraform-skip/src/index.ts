import * as core from '@actions/core';
import * as fs from 'fs';
import * as lib from './lib';

function getSkipTerraform(): boolean {
  const config = lib.getConfig();
  const renovateLogin = config.renovate_login ? config.renovate_login : 'renovate[bot]';
  if (renovateLogin != core.getInput('pr_author')) {
    return false;
  }
  // TODO change the default behavior
  // if (config.skip_terraform_by_renovate == false) {
  if (!config.skip_terraform_by_renovate) {
    return false;
  }
  const labels = fs.readFileSync(core.getInput('labels'), 'utf8').split('\n');
  const renovateTerraformLabels = new Set(config.renovate_terraform_labels ? config.renovate_terraform_labels : ['terraform']);
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    if (renovateTerraformLabels.has(label)) {
      return false;
    }
  }

  return true;
}

try {
  core.setOutput('skip_terraform', getSkipTerraform());
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
}
