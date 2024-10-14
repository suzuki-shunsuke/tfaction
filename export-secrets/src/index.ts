import * as core from "@actions/core";
import * as lib from "./lib";

try {
  lib.main();
} catch (error) {
  core.setFailed(
    error instanceof Error ? error.message : JSON.stringify(error),
  );
}
