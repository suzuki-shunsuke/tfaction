import * as core from "@actions/core";
import * as lib from "../../lib";
import * as drift from "../../lib/drift";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import { run, type Issue } from "./run";

export const main = async () => {
  // Retrieve inputs
  const issue: Issue = JSON.parse(input.getRequiredIssue());

  const config = await lib.getConfig();
  const driftIssueRepo = drift.getDriftIssueRepo(config);

  // Run business logic
  const result = run({
    issue,
    repoOwner: driftIssueRepo.owner,
    repoName: driftIssueRepo.name,
    serverUrl: env.GITHUB_SERVER_URL,
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
