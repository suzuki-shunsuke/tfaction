import * as github from "@actions/github";
import * as fs from "fs";

import * as install from "../install";
import * as ciInfo from "../ci-info";
import * as listTargetsWithChangedFiles from "./list-targets-with-changed-files";

export const main = async () => {
  // Step 1: Install dependencies
  await install.main();

  // Step 2: Run ci-info (skip for workflow_dispatch and schedule events)
  const eventName = github.context.eventName;
  const skipCiInfo =
    eventName === "workflow_dispatch" || eventName === "schedule";

  if (!skipCiInfo) {
    await ciInfo.main();
  }

  // Step 3: Check if commit is latest (for PR events)
  const isPREvent =
    eventName === "pull_request" || eventName.startsWith("pull_request_");
  if (isPREvent) {
    const ciInfoTempDir = process.env.CI_INFO_TEMP_DIR;
    if (!ciInfoTempDir) {
      throw new Error("CI_INFO_TEMP_DIR is not set");
    }

    const prJsonPath = `${ciInfoTempDir}/pr.json`;
    if (fs.existsSync(prJsonPath)) {
      const prData = JSON.parse(fs.readFileSync(prJsonPath, "utf8"));
      const latestHeadSha = prData.head?.sha;
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
  await listTargetsWithChangedFiles.main();
};
