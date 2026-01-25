export interface Secret {
  env_name: string | undefined;
  secret_name: string | undefined;
}

export type SecretToExport = {
  envName: string;
  secretName: string;
  secretValue: string;
};

export type RunInput = {
  targetSecrets?: Secret[];
  jobConfigSecrets?: Secret[];
  inputSecrets: Map<string, string>;
};

export type RunResult = {
  secretsToExport: SecretToExport[];
};

export function setSecretToMap(
  secrets: Array<Secret>,
  m: Map<string, string>,
): void {
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

export const getSecrets = (
  targetSecrets?: Secret[],
  jobConfigSecrets?: Secret[],
): Map<string, string> => {
  const secrets = new Map<string, string>();
  if (targetSecrets != undefined) {
    setSecretToMap(targetSecrets, secrets);
  }

  if (jobConfigSecrets != undefined) {
    setSecretToMap(jobConfigSecrets, secrets);
  }
  return secrets;
};

export const run = (input: RunInput): RunResult => {
  const { targetSecrets, jobConfigSecrets, inputSecrets } = input;

  const secretsMap = getSecrets(targetSecrets, jobConfigSecrets);
  const secretsToExport: SecretToExport[] = [];

  for (const [envName, secretName] of secretsMap) {
    if (!inputSecrets.has(secretName)) {
      throw new Error(`secret is not found: ${secretName}`);
    }
    const secretValue = inputSecrets.get(secretName)!;
    secretsToExport.push({
      envName,
      secretName,
      secretValue,
    });
  }

  return { secretsToExport };
};
