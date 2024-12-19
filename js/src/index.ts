import * as core from "@actions/core";
import { main } from "./run";

try {
  main({
    action: core.getInput("action"),
  });
} catch (error) {
  core.setFailed(
    error instanceof Error ? error.message : JSON.stringify(error),
  );
}
