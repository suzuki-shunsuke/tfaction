import * as core from "@actions/core";
import * as lib from "../lib";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

function exportSecret(
  envName: string,
  secretID: string,
  secretValue: string,
  secretKey: string,
) {
  if (secretKey) {
    core.info(
      `export the secret as the environment variable: secret_id=${secretID} env_name=${envName} secret_key=${secretKey}`,
    );
  } else {
    core.info(
      `export the secret as the environment variable: secret_id=${secretID} env_name=${envName}`,
    );
  }
  core.setSecret(secretValue);
  core.exportVariable(envName, secretValue);
}

async function exportSecrets(
  client: SecretsManagerClient,
  secrets: Array<lib.AWSSecretsManagerSecret>,
) {
  for (let i = 0; i < secrets.length; i++) {
    const secret = secrets[i];
    if (!secret.secret_id) {
      throw new Error("secret_id is required");
    }
    const command = new GetSecretValueCommand({
      SecretId: secret.secret_id,
    });
    const response = await client.send(command);
    if (!response.SecretString) {
      throw new Error(`SecretString is empty: secret_id=${secret.secret_id}`);
    }
    let secretJSON = null;
    for (let j = 0; j < secret.envs.length; j++) {
      const e = secret.envs[j];
      if (!e.env_name) {
        throw new Error(`env_name is required: secret_id=${secret.secret_id}`);
      }
      if (!e.secret_key) {
        exportSecret(e.env_name, secret.secret_id, response.SecretString, "");
        continue;
      }
      if (!secretJSON) {
        secretJSON = JSON.parse(response.SecretString);
      }
      if (!secretJSON[e.secret_key]) {
        throw new Error(
          `secret key isn't found: secret_key=${e.secret_key} secret_id=${secret.secret_id}`,
        );
      }
      exportSecret(
        e.env_name,
        secret.secret_id,
        secretJSON[e.secret_key],
        e.secret_key,
      );
    }
  }
}

export const main = async (): Promise<void> => {
  const config = lib.getConfig();
  const targetS = lib.getTargetFromEnv();
  const wd = lib.getWorkingDirFromEnv();
  const jobType = lib.getJobType();
  const isApply = lib.getIsApply();
  const t = await lib.getTargetGroup(config, targetS, wd);
  const jobConfig = lib.getJobConfig(t.group, isApply, jobType);
  let awsClient = null;
  if (t.group === undefined) {
    return;
  }
  if (t.group.aws_secrets_manager) {
    awsClient = new SecretsManagerClient({
      region: t.group.aws_region,
    });
    await exportSecrets(awsClient, t.group.aws_secrets_manager);
  }

  if (jobConfig && jobConfig.aws_secrets_manager) {
    if (!awsClient) {
      awsClient = new SecretsManagerClient({
        region: t.group.aws_region,
      });
    }
    await exportSecrets(awsClient, jobConfig.aws_secrets_manager);
  }
};
