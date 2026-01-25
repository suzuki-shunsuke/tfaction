// Business logic for set-drift-env action

export type Issue = {
  number: number;
  state: string;
  target: string;
};

export type RunInput = {
  issue: Issue;
  repoOwner: string;
  repoName: string;
  serverUrl: string;
};

export type EnvVars = {
  // TFCMT environment variables
  TFCMT_REPO_OWNER: string;
  TFCMT_REPO_NAME: string;
  TFCMT_PR_NUMBER: number;

  // GH_COMMENT environment variables
  GH_COMMENT_REPO_OWNER: string;
  GH_COMMENT_REPO_NAME: string;
  GH_COMMENT_PR_NUMBER: number;

  // TFACTION_DRIFT_ISSUE environment variables
  TFACTION_DRIFT_ISSUE_REPO_OWNER: string;
  TFACTION_DRIFT_ISSUE_REPO_NAME: string;
  TFACTION_DRIFT_ISSUE_REPO_FULLNAME: string;
  TFACTION_DRIFT_ISSUE_NUMBER: number;
  TFACTION_DRIFT_ISSUE_STATE: string;
  TFACTION_DRIFT_ISSUE_URL: string;

  // TFACTION environment variables
  TFACTION_JOB_TYPE: string;
  TFACTION_TARGET: string;
};

export type RunResult = {
  envVars: EnvVars;
  issueUrl: string;
};

export const run = (input: RunInput): RunResult => {
  const { issue, repoOwner, repoName, serverUrl } = input;

  const issueUrl = `${serverUrl}/${repoOwner}/${repoName}/issues/${issue.number}`;

  const envVars: EnvVars = {
    // TFCMT environment variables
    TFCMT_REPO_OWNER: repoOwner,
    TFCMT_REPO_NAME: repoName,
    TFCMT_PR_NUMBER: issue.number,

    // GH_COMMENT environment variables
    GH_COMMENT_REPO_OWNER: repoOwner,
    GH_COMMENT_REPO_NAME: repoName,
    GH_COMMENT_PR_NUMBER: issue.number,

    // TFACTION_DRIFT_ISSUE environment variables
    TFACTION_DRIFT_ISSUE_REPO_OWNER: repoOwner,
    TFACTION_DRIFT_ISSUE_REPO_NAME: repoName,
    TFACTION_DRIFT_ISSUE_REPO_FULLNAME: `${repoOwner}/${repoName}`,
    TFACTION_DRIFT_ISSUE_NUMBER: issue.number,
    TFACTION_DRIFT_ISSUE_STATE: issue.state,
    TFACTION_DRIFT_ISSUE_URL: issueUrl,

    // TFACTION environment variables
    TFACTION_JOB_TYPE: "terraform",
    TFACTION_TARGET: issue.target,
  };

  return {
    envVars,
    issueUrl,
  };
};
