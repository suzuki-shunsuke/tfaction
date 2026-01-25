import * as core from "@actions/core";
import * as lib from "../../lib";
import * as types from "../../lib/types";
import * as env from "../../lib/env";
import * as input from "../../lib/input";

export interface Secret {
  env_name: string | undefined;
  secret_name: string | undefined;
}

function setSecretToMap(secrets: Array<Secret>, m: Map<string, string>) {
  for (let i = 0; i < secrets.length; i++) {
    const secret = secrets[i];
    if (secret.env_name) {
      if (secret.secret_name) {
        m.set(secret.env_name, secret.secret_name);
      } else {
        m.set(secret.env_name, secret.env_name);
      }
    } else {
      if (secret.secret_name) {
        m.set(secret.secret_name, secret.secret_name);
      } else {
        throw new Error("either secret_name or env_name is required");
      }
    }
  }
}

const getSecrets = (
  targetConfig: types.TargetConfig,
  jobConfig: types.JobConfig | undefined,
): Map<string, string> => {
  const targetSecrets = targetConfig.secrets;
  const secrets = new Map<string, string>();
  if (targetSecrets != undefined) {
    setSecretToMap(targetSecrets, secrets);
  }

  if (jobConfig != undefined && jobConfig.secrets != undefined) {
    setSecretToMap(jobConfig.secrets, secrets);
  }
  return secrets;
};

export const main = async () => {
  const config = await lib.getConfig();
  const secrets = new Map<string, string>(
    Object.entries(JSON.parse(input.secrets)),
  );

  // Log the list of secrets for troubleshooting
  // https://github.com/suzuki-shunsuke/tfaction/issues/1564
  core.info(
    `The list of secret names passed to the action: ${Array.from(secrets.keys()).join(", ")}`,
  );

  const targetS = env.all.TFACTION_TARGET;
  const workingDir = env.all.TFACTION_WORKING_DIR;
  const jobType = lib.getJobType();
  const isApply = env.isApply;

  const t = await lib.getTargetGroup(config, targetS, workingDir);

  const jobConfig = lib.getJobConfig(t.group, isApply, jobType);
  if (t.group === undefined) {
    return;
  }
  for (const [envName, secretName] of getSecrets(t.group, jobConfig)) {
    if (!secrets.has(secretName)) {
      throw new Error(`secret is not found: ${secretName}`);
    }
    const secretValue = secrets.get(secretName);
    core.info(
      `export the secret ${secretName} as the environment variable ${envName}`,
    );
    core.exportVariable(envName, secretValue);
  }
};
