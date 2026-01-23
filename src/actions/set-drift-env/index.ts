import * as core from "@actions/core";
import * as lib from "../../lib";
import * as drift from "../../lib/drift";
import * as env from "../../lib/env";
import * as input from "../../lib/input";

type Issue = {
  number: number;
  state: string;
  target: string;
};

export const main = async () => {
  const issueInput = input.getRequiredIssue();
  const issue: Issue = JSON.parse(issueInput);

  const config = await lib.getConfig();
  const driftIssueRepo = drift.getDriftIssueRepo(config);

  const repoOwner = driftIssueRepo.owner;
  const repoName = driftIssueRepo.name;
  const serverUrl = env.githubServerUrl || "https://github.com";

  // TFCMT environment variables
  core.exportVariable("TFCMT_REPO_OWNER", repoOwner);
  core.exportVariable("TFCMT_REPO_NAME", repoName);
  core.exportVariable("TFCMT_PR_NUMBER", issue.number);

  // GH_COMMENT environment variables
  core.exportVariable("GH_COMMENT_REPO_OWNER", repoOwner);
  core.exportVariable("GH_COMMENT_REPO_NAME", repoName);
  core.exportVariable("GH_COMMENT_PR_NUMBER", issue.number);

  // TFACTION_DRIFT_ISSUE environment variables
  core.exportVariable("TFACTION_DRIFT_ISSUE_REPO_OWNER", repoOwner);
  core.exportVariable("TFACTION_DRIFT_ISSUE_REPO_NAME", repoName);
  core.exportVariable(
    "TFACTION_DRIFT_ISSUE_REPO_FULLNAME",
    `${repoOwner}/${repoName}`,
  );
  core.exportVariable("TFACTION_DRIFT_ISSUE_NUMBER", issue.number);
  core.exportVariable("TFACTION_DRIFT_ISSUE_STATE", issue.state);

  const issueUrl = `${serverUrl}/${repoOwner}/${repoName}/issues/${issue.number}`;
  core.exportVariable("TFACTION_DRIFT_ISSUE_URL", issueUrl);

  // TFACTION environment variables
  core.exportVariable("TFACTION_JOB_TYPE", "terraform");
  core.exportVariable("TFACTION_TARGET", issue.target);

  // Output notice and step summary
  core.notice(issueUrl);
  core.summary.addRaw(`[Issue](${issueUrl})`, true);
  await core.summary.write();
};
