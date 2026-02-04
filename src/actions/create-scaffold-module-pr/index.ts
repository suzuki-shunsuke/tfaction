import * as env from "../../lib/env";
import * as input from "../../lib/input";
import { run } from "./run";

export const main = async () => {
  await run({
    githubToken: input.githubToken,
    securefixAppId: input.securefixActionAppId,
    securefixAppPrivateKey: input.securefixActionAppPrivateKey,
    modulePath: env.all.TFACTION_MODULE_PATH,
    actor: env.all.GITHUB_ACTOR,
    repository: env.all.GITHUB_REPOSITORY,
    runURL: env.runURL,
  });
};
