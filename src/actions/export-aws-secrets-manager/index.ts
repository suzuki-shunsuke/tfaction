import * as core from "@actions/core";
import * as lib from "../../lib";
import * as env from "../../lib/env";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { run, type SecretToExport } from "./run";

/**
 * Mask the secret value and output it as an environment variable.
 */
function exportSecret(secret: SecretToExport): void {
  if (secret.secretKey) {
    core.info(
      `export the secret as the environment variable: secret_id=${secret.secretId} env_name=${secret.envName} secret_key=${secret.secretKey}`,
    );
  } else {
    core.info(
      `export the secret as the environment variable: secret_id=${secret.secretId} env_name=${secret.envName}`,
    );
  }
  core.setSecret(secret.secretValue);
  core.exportVariable(secret.envName, secret.secretValue);
}

export const main = async (): Promise<void> => {
  const config = await lib.getConfig();
  const t = await lib.getTargetGroup(
    config,
    env.all.TFACTION_TARGET,
    env.all.TFACTION_WORKING_DIR,
  );
  const jobConfig = lib.getJobConfig(t.group, env.isApply, lib.getJobType());

  if (t.group === undefined) {
    return;
  }

  const groupSecrets = t.group.aws_secrets_manager;
  const jobConfigSecrets = jobConfig?.aws_secrets_manager;

  if (!groupSecrets && !jobConfigSecrets) {
    return;
  }

  const awsClient = new SecretsManagerClient({
    region: t.group.aws_region,
  });

  const getSecretValue = async (secretId: string): Promise<string> => {
    const command = new GetSecretValueCommand({
      SecretId: secretId,
    });
    const response = await awsClient.send(command);
    if (!response.SecretString) {
      throw new Error(`SecretString is empty: secret_id=${secretId}`);
    }
    return response.SecretString;
  };

  const secrets = await run({
    groupSecrets,
    jobConfigSecrets,
    getSecretValue,
  });

  for (const secret of secrets) {
    exportSecret(secret);
  }
};
