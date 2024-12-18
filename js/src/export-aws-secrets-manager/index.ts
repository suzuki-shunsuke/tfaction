import * as core from "@actions/core";
import { run } from "./run";

export const main = async (): Promise<void> => {
  await run();
};
