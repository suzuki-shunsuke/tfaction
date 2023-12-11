import * as core from '@actions/core';
import * as fs from 'fs';
import * as lib from 'lib';

type Inputs = {
  skipLabelPrefix: string;
  labels: string;
  prAuthor: string;
  target?: string;
};

const getSkipTerraform = (inputs: Inputs): boolean => {
  const config = lib.getConfig();
  const renovateLogin = config.renovate_login ? config.renovate_login : 'renovate[bot]';
  const labels = fs.readFileSync(inputs.labels, 'utf8').split('\n');
  const target = inputs.target;
  if (!target) {
    throw 'TFACTION_TARGET is required';
  }
  if (renovateLogin != inputs.prAuthor) {
    for (let i = 0; i < labels.length; i++) {
      if (labels[i] == `${inputs.skipLabelPrefix}${target}`) {
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
};

try {
  const isSkip = getSkipTerraform({
    skipLabelPrefix: core.getInput('skip_label_prefix', { required: true }),
    labels: core.getInput('labels', { required: true }),
    prAuthor: core.getInput('pr_author', { required: true }),
    target: process.env.TFACTION_TARGET,
  });
  core.exportVariable('TFACTION_SKIP_TERRAFORM', isSkip);
  core.setOutput('skip_terraform', isSkip);
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
}
