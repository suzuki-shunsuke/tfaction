export function mergeSecrets(
  secrets?: string,
  awsSecrets?: string,
): Record<string, string> | undefined {
  const base = secrets
    ? (JSON.parse(secrets) as Record<string, string>)
    : undefined;
  const aws = awsSecrets
    ? (JSON.parse(awsSecrets) as Record<string, string>)
    : undefined;
  if (!base && !aws) {
    return undefined;
  }
  return { ...base, ...aws };
}
