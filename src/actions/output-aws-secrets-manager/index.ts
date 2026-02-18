import * as core from "@actions/core";
import * as lib from "../../lib";
import * as env from "../../lib/env";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { run } from "./run";

export const main = async (): Promise<void> => {
  const config = await lib.getConfig();
  const t = await lib.getTargetGroup(
    config,
    env.all.TFACTION_TARGET,
    env.all.TFACTION_WORKING_DIR,
  );
  const jobConfig = lib.getJobConfig(t.group, env.isApply, lib.getJobType());

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

  const result = await run({
    groupSecrets,
    jobConfigSecrets,
    getSecretValue,
  });

  for (const [envName, secretValue] of Object.entries(result.secrets)) {
    core.info(`output the secret: env_name=${envName}`);
    core.setSecret(secretValue);
  }
  core.setOutput("secrets", JSON.stringify(result.secrets));
};
