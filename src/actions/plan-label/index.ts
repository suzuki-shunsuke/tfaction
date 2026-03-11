import * as github from "@actions/github";

import * as input from "../../lib/input";
import { main as runPlanLabel } from "./run";

export const main = async () => {
  await runPlanLabel({
    githubToken: input.githubToken,
    prNumber: github.context.issue.number,
    workflowRunId: github.context.runId,
  });
};
