import * as core from '@actions/core';
import * as lib from './lib';
import { SecretsManagerClient, GetSecretValueCommand, GetSecretValueCommandInput } from '@aws-sdk/client-secrets-manager';

async function exportSecrets(client: SecretsManagerClient, secrets: Array<lib.AWSSecretsManagerSecret>) {
  for (let i = 0; i < secrets.length; i++) {
    const secret = secrets[i];
    if (!secret.secret_id) {
      throw 'secret_id is required';
    }
    const command = new GetSecretValueCommand({
      SecretId: secret.secret_id,
    });
    const response = await client.send(command);
    if (!response.SecretString) {
      throw `SecretString is empty: secret_id=${secret.secret_id}`;
    }
    let secretJSON = null;
    for (let j = 0; j < secret.envs.length; j++) {
      const e = secret.envs[j];
      if (!e.env_name) {
        throw `env_name is required: secret_id=${secret.secret_id}`;
      }
      if (!e.secret_key) {
        core.info(`export the secret ${secret.secret_id} as the environment variable ${e.env_name}`);
        core.exportVariable(e.env_name, response.SecretString);
        continue;
      }
      if (!secretJSON) {
        secretJSON = JSON.parse(response.SecretString);
      }
      if (!secretJSON[e.secret_key]) {
        throw `secret key isn't found: secret_key=${e.secret_key} secret_id=${secret.secret_id}`;
      }
      core.info(`export the secret ${e.secret_key} as the environment variable ${e.env_name}`);
      core.exportVariable(e.env_name, secretJSON[e.secret_key]);
    }
  }
}

export const run = async (): Promise<void> => {
  const config = lib.getConfig();
  const targetS = lib.getTarget();
  const jobType = lib.getJobType();
  const isApply = lib.getIsApply();
  const targetConfig = lib.getTargetConfig(config.target_groups, targetS);
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
}
