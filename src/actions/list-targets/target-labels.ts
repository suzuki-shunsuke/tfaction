import * as github from "@actions/github";
import type { TargetLabelRule } from "../../lib/types";

export const generateLabels = (
  targets: string[],
  rules: TargetLabelRule[],
): Map<string, string | undefined> => {
  const labels = new Map<string, string | undefined>();
  for (const target of targets) {
    for (const rule of rules) {
      const re = new RegExp(rule.regexp);
      if (re.test(target)) {
        const labelName = target.replace(re, rule.label);
        if (!labels.has(labelName) || rule.color !== undefined) {
          labels.set(labelName, rule.color);
        }
      }
    }
  }
  return labels;
};

export const addTargetLabels = async (
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  prNumber: number,
  targets: string[],
  rules: TargetLabelRule[],
): Promise<void> => {
  const labels = generateLabels(targets, rules);
  if (labels.size === 0) return;

  const labelNames = [...labels.keys()];
  const { data: addedLabels } = await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number: prNumber,
    labels: labelNames,
  });

  for (const [labelName, color] of labels) {
    if (color === undefined) continue;
    const added = addedLabels.find((l) => l.name === labelName);
    if (added && added.color !== color) {
      await octokit.rest.issues.updateLabel({
        owner,
        repo,
        name: labelName,
        color,
      });
    }
  }
};
