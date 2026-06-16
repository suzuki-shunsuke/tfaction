import * as core from "@actions/core";
import * as lib from "lib";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandInput,
} from "@aws-sdk/client-secrets-manager";

function exportSecret(
  envName: string,
  secretID: string,
  secretValue: string,
  secretKey: string,
) {
  if (secretKey) {
    core.info(
      `output the secret: secret_id=${secretID} env_name=${envName} secret_key=${secretKey}`,
    );
  } else {
    core.info(`output the secret: secret_id=${secretID} env_name=${envName}`);
  }
  core.setSecret(secretValue);
  core.setOutput(envName, secretValue);
}

async function exportSecrets(
  client: SecretsManagerClient,
  secrets: Array<lib.AWSSecretsManagerSecret>,
) {
  for (const secret of secrets) {
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
    const secretMap = new Map<string, string>();
    for (const e of secret.envs) {
      if (!e.env_name) {
        throw new Error(`env_name is required: secret_id=${secret.secret_id}`);
      }
      if (!e.secret_key) {
        secretMap.set(e.env_name, response.SecretString);
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
      const secretValue = secretJSON[e.secret_key];
      secretMap.set(e.env_name, secretValue);
      exportSecret(e.env_name, secret.secret_id, secretValue, e.secret_key);
    }
    const secretMapJSON = JSON.stringify(secretMap);
    core.setSecret(secretMapJSON);
    core.setOutput("secrets", secretMapJSON);
  }
}

export const run = async (): Promise<void> => {
  const config = lib.getConfig();
  const targetS = lib.getTarget();
  const jobType = lib.getJobType();
  const isApply = lib.getIsApply();
  const targetConfig = lib.getTargetFromTargetGroups(
    config.target_groups,
    targetS,
  );
  if (!targetConfig) {
    throw new Error("target is invalid");
  }
  const jobConfig = lib.getJobConfig(targetConfig, isApply, jobType);
  let awsClient = null;
  if (targetConfig.aws_secrets_manager) {
    awsClient = new SecretsManagerClient({
      region: targetConfig.aws_region,
    });
    await exportSecrets(awsClient, targetConfig.aws_secrets_manager);
  }

  if (jobConfig && jobConfig.aws_secrets_manager) {
    if (!awsClient) {
      awsClient = new SecretsManagerClient({
        region: targetConfig.aws_region,
      });
    }
    await exportSecrets(awsClient, jobConfig.aws_secrets_manager);
  }
};
