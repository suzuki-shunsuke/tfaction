function isPlainObject(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return false;
  }
  for (const key of Object.keys(value)) {
    if (typeof (value as Record<string, unknown>)[key] !== "string") {
      return false;
    }
  }
  return true;
}

export function mergeSecrets(
  secrets?: string,
  awsSecrets?: string,
): Record<string, string> | undefined {
  let base: Record<string, string> | undefined;
  let aws: Record<string, string> | undefined;
  if (secrets) {
    const parsed = JSON.parse(secrets);
    if (!isPlainObject(parsed)) {
      throw new Error("secrets must be a JSON object with string values");
    }
    base = parsed;
  }
  if (awsSecrets) {
    const parsed = JSON.parse(awsSecrets);
    if (!isPlainObject(parsed)) {
      throw new Error("aws_secrets must be a JSON object with string values");
    }
    aws = parsed;
  }
  if (!base && !aws) {
    return undefined;
  }
  return Object.assign(Object.create(null), base, aws);
}
