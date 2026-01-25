import * as core from "@actions/core";
import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import { run } from "./run";

export const main = async () => {
  const config = await lib.getConfig();
  const inputSecrets = new Map<string, string>(
    Object.entries(JSON.parse(input.secrets)),
  );

  // Log the list of secrets for troubleshooting
  // https://github.com/suzuki-shunsuke/tfaction/issues/1564
  core.info(
    `The list of secret names passed to the action: ${Array.from(inputSecrets.keys()).join(", ")}`,
  );

  const t = await lib.getTargetGroup(
    config,
    env.all.TFACTION_TARGET,
    env.all.TFACTION_WORKING_DIR,
  );
  if (t.group === undefined) {
    return;
  }

  const jobConfig = lib.getJobConfig(t.group, env.isApply, lib.getJobType());

  const result = run({
    targetSecrets: t.group.secrets,
    jobConfigSecrets: jobConfig?.secrets,
    inputSecrets,
  });

  for (const secret of result.secretsToExport) {
    core.info(
      `export the secret ${secret.secretName} as the environment variable ${secret.envName}`,
    );
    core.exportVariable(secret.envName, secret.secretValue);
  }
};
