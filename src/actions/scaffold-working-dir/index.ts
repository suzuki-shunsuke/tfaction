import * as env from "../../lib/env";
import * as input from "../../lib/input";
import { run } from "./run";

export const main = async () => {
  await run({
    target: env.all.TFACTION_TARGET,
    workingDir: env.all.TFACTION_WORKING_DIR,
    githubToken: input.githubToken,
    repository: env.all.GITHUB_REPOSITORY,
  });
};
