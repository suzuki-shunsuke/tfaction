import * as core from "@actions/core";
import * as lib from "../lib";
import * as input from "../lib/input";
import { run } from "./run";

export const main = async () => {
  await run({
    githubToken: input.githubToken,
    aquaGlobalConfig: lib.aquaGlobalConfig,
    exportVariable: core.exportVariable,
  });
};
