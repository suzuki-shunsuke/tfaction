import * as core from "@actions/core";
import * as lib from "../../lib";
import * as drift from "../../lib/drift";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import { run, type Issue } from "./run";

export const main = async () => {
  // Retrieve inputs
  const issueInput = input.getRequiredIssue();
  const issue: Issue = JSON.parse(issueInput);

  const config = await lib.getConfig();
  const driftIssueRepo = drift.getDriftIssueRepo(config);

  const repoOwner = driftIssueRepo.owner;
  const repoName = driftIssueRepo.name;
  const serverUrl = env.GITHUB_SERVER_URL || "https://github.com";

  // Run business logic
  const result = run({
    issue,
    repoOwner,
    repoName,
    serverUrl,
  });

  // Export environment variables
  for (const [key, value] of Object.entries(result.envVars)) {
    core.exportVariable(key, value);
  }

  // Output notice and step summary
  core.notice(result.issueUrl);
  core.summary.addRaw(`[Issue](${result.issueUrl})`, true);
  await core.summary.write();
};
