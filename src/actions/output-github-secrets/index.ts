import * as core from "@actions/core";
import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import { getTargetConfig } from "../get-target-config";
import { run } from "./run";

export const main = async () => {
  const config = await lib.getConfig();
  const targetConfig = await getTargetConfig(
    {
      target: env.all.TFACTION_TARGET,
      workingDir: env.all.TFACTION_WORKING_DIR,
      isApply: env.isApply,
      jobType: lib.getJobType(),
    },
    config,
  );

  const result = run({
    githubSecrets: input.githubSecrets,
    secretsConfig: targetConfig.secretsConfig,
  });

  for (const [envName, secretName] of Object.entries(
    targetConfig.secretsConfig ?? {},
  )) {
    core.info(
      `map the secret ${secretName} to the environment variable ${envName}`,
    );
  }

  core.setOutput("secrets", JSON.stringify(result.secrets));
};
