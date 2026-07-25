// plan_storage.ts: Store the Terraform plan file in S3 with access control
// instead of GitHub Artifacts, and describe where it is stored via a small
// metadata file (uploaded to GitHub Artifacts) that apply and plan-label read.

import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

// File name of the plan binary stored in S3.
const planFileName = "plan.out";

// Local file name of the metadata file inside its artifact.
export const metaFileName = "plan_meta.json";

// Artifact name of the metadata file for a target.
export const metaArtifactName = (target: string): string =>
  `terraform_plan_meta_${target.replaceAll("/", "__")}`;

// Prefix of the metadata artifact name, used to filter artifacts.
export const metaArtifactNamePrefix = "terraform_plan_meta_";

// The metadata file is self-describing: it records where the plan file is
// stored (storage), the plan file hash (for tamper detection), and the plan
// result summary (for plan-label). All of these are non-sensitive.
export const PlanMeta = z.object({
  storage: z.enum(["s3", "github-artifacts"]),
  bucket: z.string().optional(),
  key_prefix: z.string().optional(),
  hash: z
    .object({
      plan: z.string(),
    })
    .optional(),
  summary: z.enum(["no-op", "update", "create", "delete"]),
});
export type PlanMeta = z.infer<typeof PlanMeta>;

export const sha256File = (filePath: string): string =>
  crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");

const normalizePrefix = (prefix: string): string => {
  if (prefix === "") {
    return "";
  }
  return prefix.endsWith("/") ? prefix : `${prefix}/`;
};

// Build the object key prefix, unique per workflow run id and attempt number.
export const buildKeyPrefix = (
  keyPrefix: string | undefined,
  runId: string,
  attempt: string,
  target: string,
): string => {
  const base = normalizePrefix(keyPrefix ?? "tfaction_plan/");
  return `${base}${runId}/${attempt}/${target}/`;
};

export type UploadPlanToS3Params = {
  bucket: string;
  keyPrefix?: string;
  runId: string;
  attempt: string;
  target: string;
};

// Upload the plan file to S3 and return the resolved key prefix and hash.
export const uploadPlanToS3 = async (
  params: UploadPlanToS3Params,
  planBinaryPath: string,
): Promise<{ keyPrefix: string; hash: string }> => {
  const s3 = new S3Client({});
  const keyPrefix = buildKeyPrefix(
    params.keyPrefix,
    params.runId,
    params.attempt,
    params.target,
  );
  await s3.send(
    new PutObjectCommand({
      Bucket: params.bucket,
      Key: `${keyPrefix}${planFileName}`,
      Body: fs.readFileSync(planBinaryPath),
    }),
  );
  return { keyPrefix, hash: sha256File(planBinaryPath) };
};

// Download the plan file from S3 to dest and return its path.
// The S3 client region is resolved from the environment (AWS_REGION, etc.).
export const downloadPlanFromS3 = async (
  bucket: string,
  keyPrefix: string,
  dest: string,
): Promise<string> => {
  const s3 = new S3Client({});
  const key = `${keyPrefix}${planFileName}`;
  const res = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
  if (!res.Body) {
    throw new Error(`plan file not found in S3: ${bucket}/${key}`);
  }
  const bytes = await res.Body.transformToByteArray();
  const filePath = path.join(dest, planFileName);
  fs.writeFileSync(filePath, Buffer.from(bytes));
  return filePath;
};
