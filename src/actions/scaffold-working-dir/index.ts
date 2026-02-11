import * as env from "../../lib/env";
import { run } from "./run";

export const main = async () => {
  await run({
    target: env.all.TFACTION_TARGET,
    workingDir: env.all.TFACTION_WORKING_DIR,
  });
};
