import * as fs from "fs";
import * as path from "path";
import * as core from "@actions/core";
import * as lib from "../lib";
import * as getGlobalConfig from "../get-global-config";

type Inputs = {
  skipLabelPrefix: string;
  labels: string;
  prAuthor: string;
  target?: string;
};

export const main = async () => {
  const config = lib.getConfig();
  const globalConfig = getGlobalConfig.main_(config, {});
  if (!process.env.CI_INFO_TEMP_DIR) {
    throw new Error("CI_INFO_TEMP_DIR is not set");
  }
  if (!process.env.CI_INFO_PR_AUTHOR) {
    throw new Error("CI_INFO_PR_AUTHOR is not set");
  }
  const inputs = {
    skipLabelPrefix: globalConfig.outputs.label_prefix_skip,
    labels: path.join(process.env.CI_INFO_TEMP_DIR, "labels.txt"),
    prAuthor: process.env.CI_INFO_PR_AUTHOR,
    target: process.env.TFACTION_TARGET,
  };
  // labels is pull request's labels.
  const labels = fs.readFileSync(inputs.labels, "utf8").split("\n");

  const isSkip = getSkipTerraform(inputs, config, labels);
  core.exportVariable("TFACTION_SKIP_TERRAFORM", isSkip);
  core.setOutput("skip_terraform", isSkip);
};

export const getSkipTerraform = (
  inputs: Inputs,
  config: lib.Config,
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
