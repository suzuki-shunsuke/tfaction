import * as core from "@actions/core";

export type Inputs = {
  skipLabelPrefix: string;
  labels: string[];
  prAuthor: string;
  target?: string;
};

type SkipTerraformConfig = {
  renovate_login?: string;
  skip_terraform_by_renovate?: boolean;
  renovate_terraform_labels?: string[];
};

export const main = async (config: SkipTerraformConfig, inputs: Inputs) => {
  const isSkip = getSkipTerraform(inputs, config, inputs.labels);
  core.exportVariable("TFACTION_SKIP_TERRAFORM", isSkip);
  core.setOutput("skip_terraform", isSkip);
};

export const getSkipTerraform = (
  inputs: Inputs,
  config: SkipTerraformConfig,
  labels: string[],
): boolean => {
  // https://suzuki-shunsuke.github.io/tfaction/docs/feature/support-skipping-terraform-renovate-pr
  const renovateLogin = config.renovate_login ?? "renovate[bot]";

  if (!inputs.target) {
    throw new Error("TFACTION_TARGET is required");
  }

  if (renovateLogin !== inputs.prAuthor) {
    // If pull request author isn't Renovate bot
    // If the pull request has the skip label of the target, terraform is skipped.
    for (let i = 0; i < labels.length; i++) {
      if (labels[i] == `${inputs.skipLabelPrefix}${inputs.target}`) {
        return true;
      }
    }
    return false;
  }

  if (!config.skip_terraform_by_renovate) {
    return false;
  }

  // If the pull request has labels of renovate_terraform_labels, terraform is run.
  const renovateTerraformLabels = new Set(
    config.renovate_terraform_labels ?? ["terraform"],
  );
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    if (renovateTerraformLabels.has(label)) {
      return false;
    }
  }

  return true;
};
