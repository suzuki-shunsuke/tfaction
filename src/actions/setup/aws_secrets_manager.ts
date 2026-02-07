import { AWSSecretsManagerSecret } from "../../lib/types";

export type SecretToExport = {
  envName: string;
  secretId: string;
  secretValue: string;
  secretKey: string;
};

export type RunInput = {
  groupSecrets?: AWSSecretsManagerSecret[];
  jobConfigSecrets?: AWSSecretsManagerSecret[];
  getSecretValue: (secretId: string) => Promise<string>;
};

/**
 * Build a list of secrets to export from the configuration and fetched secret values.
 *
 * @param secrets - Array of secret configurations
 * @param secretValues - Map of secret_id to fetched secret value
 * @returns Array of secrets to export with resolved values
 */
export function buildSecretsToExport(
  secrets: AWSSecretsManagerSecret[],
  secretValues: Map<string, string>,
): SecretToExport[] {
  const result: SecretToExport[] = [];

  for (const secret of secrets) {
    if (!secret.secret_id) {
      throw new Error("secret_id is required");
    }
    const secretString = secretValues.get(secret.secret_id);
    if (secretString === undefined) {
      throw new Error(
        `Secret value not found for secret_id=${secret.secret_id}`,
      );
    }

    let secretJSON: Record<string, string> | null = null;

    for (const e of secret.envs) {
      if (!e.env_name) {
        throw new Error(`env_name is required: secret_id=${secret.secret_id}`);
      }

      if (!e.secret_key) {
        // Plain string value (no JSON parsing needed)
        result.push({
          envName: e.env_name,
          secretId: secret.secret_id,
          secretValue: secretString,
          secretKey: "",
        });
        continue;
      }

      // Parse JSON only once per secret
      if (!secretJSON) {
        secretJSON = JSON.parse(secretString) as Record<string, string>;
      }

      if (!secretJSON[e.secret_key]) {
        throw new Error(
          `secret key isn't found: secret_key=${e.secret_key} secret_id=${secret.secret_id}`,
        );
      }

      result.push({
        envName: e.env_name,
        secretId: secret.secret_id,
        secretValue: secretJSON[e.secret_key],
        secretKey: e.secret_key,
      });
    }
  }

  return result;
}

/**
 * Fetch secrets from AWS Secrets Manager and return a list of secrets to export.
 *
 * @param input - RunInput containing secrets configuration and fetch function
 * @returns Array of secrets to export
 */
export async function run(input: RunInput): Promise<SecretToExport[]> {
  const { groupSecrets, jobConfigSecrets, getSecretValue } = input;

  const allSecrets = [...(groupSecrets ?? []), ...(jobConfigSecrets ?? [])];
  if (allSecrets.length === 0) {
    return [];
  }

  // Collect unique secret IDs
  const secretIds = new Set<string>();
  for (const secret of allSecrets) {
    if (secret.secret_id) {
      secretIds.add(secret.secret_id);
    }
  }

  // Fetch all secret values
  const secretValues = new Map<string, string>();
  for (const secretId of secretIds) {
    const value = await getSecretValue(secretId);
    secretValues.set(secretId, value);
  }

  // Build secrets to export from group secrets
  const groupSecretsToExport = groupSecrets
    ? buildSecretsToExport(groupSecrets, secretValues)
    : [];

  // Build secrets to export from job config secrets
  const jobConfigSecretsToExport = jobConfigSecrets
    ? buildSecretsToExport(jobConfigSecrets, secretValues)
    : [];

  return [...groupSecretsToExport, ...jobConfigSecretsToExport];
}
