type Inputs = {
  githubSecrets: string;
  secretsConfig?: Record<string, string>;
};

type Result = {
  secrets: Record<string, string>;
};

export const run = (inputs: Inputs): Result => {
  if (!inputs.secretsConfig) {
    return { secrets: {} };
  }

  const githubSecrets: Record<string, string> = JSON.parse(
    inputs.githubSecrets,
  );
  const secrets: Record<string, string> = {};
  for (const [envName, secretName] of Object.entries(inputs.secretsConfig)) {
    if (!(secretName in githubSecrets)) {
      throw new Error(`secret is not found: ${secretName}`);
    }
    secrets[envName] = githubSecrets[secretName];
  }
  return { secrets };
};
