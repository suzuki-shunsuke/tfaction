import * as core from "@actions/core";
import * as lib from "lib";
import * as path from "path";
import { main } from "./run";

try {
  main();
} catch (error) {
  core.setFailed(
    error instanceof Error ? error.message : JSON.stringify(error),
  );
}
