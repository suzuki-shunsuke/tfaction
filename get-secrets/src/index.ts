import * as core from "@actions/core";
import { run } from "./run";

const main = async (): Promise<void> => {
  await run();
};

main().catch((e) =>
  core.setFailed(e instanceof Error ? e.message : JSON.stringify(e)),
);
