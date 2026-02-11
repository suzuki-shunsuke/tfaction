import * as env from "../../lib/env";
import * as input from "../../lib/input";
import { run } from "./run";

export const main = async () => {
  await run({
    githubToken: input.githubToken,
    modulePath: env.all.TFACTION_MODULE_PATH,
    moduleTemplateDir: env.all.TFACTION_MODULE_TEMPLATE_DIR,
    repository: env.all.GITHUB_REPOSITORY,
  });
};
