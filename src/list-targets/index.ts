import * as github from "@actions/github";
import * as core from "@actions/core";

import * as ciInfo from "../ci-info";
import * as aqua from "../aqua";
import * as lib from "../lib";
import * as input from "../lib/input";
import * as listTargetsWithChangedFiles from "./list-targets-with-changed-files";

export const main = async () => {
  core.exportVariable("AQUA_GLOBAL_CONFIG", lib.aquaGlobalConfig);
  const executor = await aqua.NewExecutor({
    githubToken: input.githubToken,
  });

  // Step 2: Run ci-info (skip for workflow_dispatch and schedule events)
  const eventName = github.context.eventName;
  const skipCiInfo =
    eventName === "workflow_dispatch" || eventName === "schedule";

  let pr: ciInfo.Result = {};

  if (!skipCiInfo) {
    pr = await ciInfo.main();
  }

  // Step 3: Check if commit is latest (for PR events)
  const isPREvent =
    eventName === "pull_request" || eventName.startsWith("pull_request_");
  if (isPREvent) {
    if (pr.pr) {
      const latestHeadSha = pr.pr.data.head.sha;
      const headSha = github.context.payload.pull_request?.head?.sha;

      if (headSha && latestHeadSha && headSha !== latestHeadSha) {
        throw new Error(
          `The head sha (${headSha}) isn't latest (${latestHeadSha}).`,
        );
      }
    }
  }

  // Step 4: Run list-targets-with-changed-files
  // The outputs (modules, targets) are set by listTargetsWithChangedFiles.main()
  await listTargetsWithChangedFiles.main(executor, pr);
};
