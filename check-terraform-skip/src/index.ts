import * as core from '@actions/core';
import * as fs from 'fs';
import * as lib from './lib';

function getSkipTerraform(): boolean {
  const config = lib.getConfig();
  const renovateLogin = config.renovate_login ? config.renovate_login : 'renovate[bot]';
  const skipLabelPrefix = core.getInput('skip_label_prefix', { required: true });
  const labels = fs.readFileSync(core.getInput('labels', { required: true }), 'utf8').split('\n');
  const target = process.env.TFACTION_TARGET;
  if (!target) {
    throw 'TFACTION_TARGET is required';
  }
  if (renovateLogin != core.getInput('pr_author', { required: true })) {
    for (let i = 0; i < labels.length; i++) {
      if (labels[i] == `${skipLabelPrefix}${target}` ) {
        return true;
      }
    }
    return false;
  }
  if (!config.skip_terraform_by_renovate) {
    return false;
  }
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
  const isSkip = getSkipTerraform();
  core.exportVariable('TFACTION_SKIP_TERRAFORM', isSkip);
  core.setOutput('skip_terraform', isSkip);
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
}
