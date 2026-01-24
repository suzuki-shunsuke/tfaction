import * as github from "@actions/github";
import { Config, TargetGroup, TargetConfig } from "./types";

export type Issue = {
  url: string;
  number: number;
  state: string;
  title: string;
  target: string;
};

export const createIssue = async (
  target: string,
  ghToken: string,
  repoOwner: string,
  repoName: string,
): Promise<Issue> => {
  const octokit = github.getOctokit(ghToken);
  const body = `
  This issues was created by [tfaction](https://suzuki-shunsuke.github.io/tfaction/docs/).

  About this issue, please see [the document](https://suzuki-shunsuke.github.io/tfaction/docs/feature/drift-detection).
  `;

  const issue = await octokit.rest.issues.create({
    owner: repoOwner,
    repo: repoName,
    title: `Terraform Drift (${target})`,
    body: body,
  });
  return {
    url: issue.data.html_url,
    number: issue.data.number,
    title: issue.data.title,
    target: target,
    state: issue.data.state,
  };
};

export const checkDriftDetectionEnabled = (
  cfg: Config,
  targetGroup: TargetGroup | undefined,
  wdCfg: TargetConfig,
): boolean => {
  if (wdCfg.drift_detection) {
    return wdCfg.drift_detection.enabled ?? true;
  }
  if (targetGroup?.drift_detection) {
    return targetGroup.drift_detection.enabled ?? true;
  }
  return cfg.drift_detection?.enabled ?? false;
};

export interface DriftIssueRepo {
  owner: string;
  name: string;
}

export const getDriftIssueRepo = (cfg: Config): DriftIssueRepo => {
  return {
    owner: cfg.drift_detection?.issue_repo_owner ?? github.context.repo.owner,
    name: cfg.drift_detection?.issue_repo_name ?? github.context.repo.repo,
  };
};
