import * as core from "@actions/core";
import * as lib from "lib";
import { main } from "./run";

try {
  const config = lib.getConfig();
  const result = main(config, {
    repository: process.env.GITHUB_REPOSITORY,
    drift_issue_number: process.env.TFACTION_DRIFT_ISSUE_NUMBER,
  });
  for (const [key, value] of Object.entries(result.envs)) {
    core.exportVariable(key, value);
  }
  for (const [key, value] of Object.entries(result.outputs)) {
    core.setOutput(key, value);
  }
} catch (error) {
  core.setFailed(
    error instanceof Error ? error.message : JSON.stringify(error),
  );
}
