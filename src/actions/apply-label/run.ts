import * as core from "@actions/core";
import * as github from "@actions/github";

export type RunInputs = {
  githubToken: string;
  prNumber: number;
  result: string;
};

const FAIL_LABEL = "tfaction:apply-result:fail";
const FAIL_LABEL_COLOR = "d93f0b";

export const main = async (inputs: RunInputs): Promise<void> => {
  if (inputs.result === "skipped") {
    core.info("Result is skipped, doing nothing");
    return;
  }

  const { owner, repo } = github.context.repo;
  const octokit = github.getOctokit(inputs.githubToken);

  const { data: currentLabels } = await octokit.rest.issues.listLabelsOnIssue({
    owner,
    repo,
    issue_number: inputs.prNumber,
  });

  const hasFailLabel = currentLabels.some((l) => l.name === FAIL_LABEL);

  if (inputs.result === "success") {
    if (hasFailLabel) {
      await octokit.rest.issues.removeLabel({
        owner,
        repo,
        issue_number: inputs.prNumber,
        name: FAIL_LABEL,
      });
      core.info(`Removed label "${FAIL_LABEL}" from PR #${inputs.prNumber}`);
    }
    return;
  }

  // failure or cancelled
  if (!hasFailLabel) {
    const { data: addedLabels } = await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: inputs.prNumber,
      labels: [FAIL_LABEL],
    });
    core.info(`Added label "${FAIL_LABEL}" to PR #${inputs.prNumber}`);
    const failLabel = addedLabels.find((l) => l.name === FAIL_LABEL);
    if (failLabel && failLabel.color !== FAIL_LABEL_COLOR) {
      await octokit.rest.issues.updateLabel({
        owner,
        repo,
        name: FAIL_LABEL,
        color: FAIL_LABEL_COLOR,
      });
      core.info(`Updated label "${FAIL_LABEL}" color to #${FAIL_LABEL_COLOR}`);
    }
  }
};
