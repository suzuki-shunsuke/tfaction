// plan_hash.ts: Compute a one-way hash of the Terraform plan result so that a
// plan run can tell whether the result is the same as the previous run's
// without reading the previous plan file or plan JSON.
// The hash is stored in the plan metadata file (plan_meta.json).

import * as crypto from "crypto";
import { z } from "zod";
import { KMSClient, GenerateMacCommand } from "@aws-sdk/client-kms";

// Bump this when the normalization changes so that hashes computed by an older
// version never match (a mismatch dismisses approvals, which is the safe side).
const formatVersion = "v1";

const Change = z.object({
  actions: z.string().array(),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  after_unknown: z.unknown().optional(),
  before_sensitive: z.unknown().optional(),
  after_sensitive: z.unknown().optional(),
  replace_paths: z.unknown().optional(),
  importing: z.unknown().optional(),
  generated_config: z.string().optional(),
});

// Unknown keys are stripped, so only the fields affecting apply are hashed.
const ResourceChange = z.object({
  address: z.string(),
  provider_name: z.string().optional(),
  previous_address: z.string().optional(),
  deposed: z.string().optional(),
  action_reason: z.string().optional(),
  change: Change,
});
type ResourceChange = z.infer<typeof ResourceChange>;

const OutputChange = z.object({
  actions: z.string().array(),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  after_unknown: z.unknown().optional(),
  before_sensitive: z.unknown().optional(),
  after_sensitive: z.unknown().optional(),
});
type OutputChange = z.infer<typeof OutputChange>;

// Fields such as timestamp, terraform_version, prior_state, configuration,
// planned_values, resource_drift, and checks are excluded because they change
// even if the plan result is the same, or they don't affect apply.
const PlanJson = z.object({
  resource_changes: ResourceChange.array().nullish(),
  output_changes: z.record(z.string(), OutputChange).nullish(),
});

const isNoop = (actions: string[]): boolean =>
  actions.length === 1 && actions[0] === "no-op";

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export const sensitiveMask = "(sensitive value)";

// Replace values marked as sensitive (before_sensitive / after_sensitive)
// with a fixed string.
export const maskSensitive = (value: unknown, sensitive: unknown): unknown => {
  if (sensitive === true) {
    return sensitiveMask;
  }
  if (Array.isArray(sensitive) && Array.isArray(value)) {
    return value.map((v, i) => maskSensitive(v, sensitive[i]));
  }
  if (isObject(sensitive) && isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        maskSensitive(v, sensitive[k]),
      ]),
    );
  }
  return value;
};

// Serialize a value as JSON with sorted object keys (like RFC 8785) so that
// the same value always produces the same string.
export const canonicalize = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((v) => (v === undefined ? "null" : canonicalize(v))).join(",")}]`;
  }
  if (isObject(value)) {
    const keys = Object.keys(value)
      .filter((k) => value[k] !== undefined)
      .sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

const maskChange = <T extends OutputChange>(change: T): T => ({
  ...change,
  before: maskSensitive(change.before, change.before_sensitive),
  after: maskSensitive(change.after, change.after_sensitive),
});

// Inputs other than the plan JSON that affect apply.
export type PlanContext = {
  target: string;
  destroy: boolean;
  // The git tree object id of the working directory.
  // It covers files that aren't in the plan JSON, such as scripts run by
  // provisioners and the committed .terraform.lock.hcl.
  treeSHA: string;
  // The content of .terraform.lock.hcl at plan time (null if it doesn't exist).
  // It covers the selected providers even if the lock file isn't committed.
  // Terraform guarantees that apply uses the same providers as the plan file.
  lockFile: string | null;
};

export type NormalizeOptions = PlanContext & {
  // Mask sensitive values. This must be true when the hash isn't keyed,
  // otherwise low-entropy sensitive values could be brute-forced from the hash.
  maskSensitive: boolean;
  // Identifies the hash method, so a hash computed by another method never
  // matches.
  method: string;
};

// Extract the parts of the plan JSON (terraform show -json) that affect apply
// and serialize them canonically.
export const normalizePlan = (
  planJsonContent: string,
  opts: NormalizeOptions,
): string => {
  const plan = PlanJson.parse(JSON.parse(planJsonContent));
  const resourceChanges = (plan.resource_changes ?? [])
    // Moves and imports are shown in the plan even if the action is no-op.
    .filter(
      (rc) =>
        !isNoop(rc.change.actions) ||
        rc.previous_address !== undefined ||
        (rc.change.importing !== undefined && rc.change.importing !== null),
    )
    .map((rc): ResourceChange =>
      opts.maskSensitive ? { ...rc, change: maskChange(rc.change) } : rc,
    )
    .sort((a, b) => {
      const ka = `${a.address}\u0000${a.deposed ?? ""}`;
      const kb = `${b.address}\u0000${b.deposed ?? ""}`;
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });
  const outputChanges = Object.fromEntries(
    Object.entries(plan.output_changes ?? {})
      .filter(([, oc]) => !isNoop(oc.actions))
      .map(([name, oc]) => [name, opts.maskSensitive ? maskChange(oc) : oc]),
  );
  return canonicalize({
    version: formatVersion,
    method: opts.method,
    target: opts.target,
    destroy: opts.destroy,
    tree_sha: opts.treeSHA,
    lock_file: opts.lockFile,
    resource_changes: resourceChanges,
    output_changes: outputChanges,
  });
};

export type AWSKMSKey = {
  keyId: string;
  region?: string;
};

// The region of the KMS key: the explicit one, or the one in the key ARN.
// Otherwise the SDK resolves it from the environment (AWS_REGION etc).
export const resolveKMSRegion = (key: AWSKMSKey): string | undefined => {
  if (key.region) {
    return key.region;
  }
  const m = /^arn:[^:]+:kms:([^:]+):/.exec(key.keyId);
  return m?.[1];
};

// Generate an HMAC with AWS KMS so that the key never leaves KMS.
// GenerateMac accepts at most 4096 bytes, so the SHA-256 digest is passed.
const generateMac = async (key: AWSKMSKey, digest: Buffer): Promise<string> => {
  const region = resolveKMSRegion(key);
  const client = new KMSClient(region ? { region } : {});
  const res = await client.send(
    new GenerateMacCommand({
      KeyId: key.keyId,
      MacAlgorithm: "HMAC_SHA_256",
      Message: digest,
    }),
  );
  if (!res.Mac) {
    throw new Error("AWS KMS GenerateMac returned no MAC");
  }
  return Buffer.from(res.Mac).toString("hex");
};

export type ComputePlanHashOptions = PlanContext & {
  awsKMSKey?: AWSKMSKey;
};

// Compute a one-way hash of the plan result.
// With an AWS KMS key, the hash is an HMAC including sensitive values.
// Without it, sensitive values are masked before hashing with SHA-256, so
// changes of only sensitive values aren't detected.
export const computePlanHash = async (
  planJsonContent: string,
  opts: ComputePlanHashOptions,
  mac: (key: AWSKMSKey, digest: Buffer) => Promise<string> = generateMac,
): Promise<string> => {
  const method = opts.awsKMSKey ? "hmac-sha256-aws-kms" : "sha256";
  const normalized = normalizePlan(planJsonContent, {
    target: opts.target,
    destroy: opts.destroy,
    treeSHA: opts.treeSHA,
    lockFile: opts.lockFile,
    maskSensitive: !opts.awsKMSKey,
    method,
  });
  const digest = crypto.createHash("sha256").update(normalized).digest();
  const value = opts.awsKMSKey
    ? await mac(opts.awsKMSKey, digest)
    : digest.toString("hex");
  return `${formatVersion}:${method}:${value}`;
};
