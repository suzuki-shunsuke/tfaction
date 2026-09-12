import * as core from "@actions/core";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { credentials } from "@suzuki-shunsuke/actions-aws-oidc";
import {
  createJwt,
  type CredentialsProvider,
  regionFromKeyId,
} from "@suzuki-shunsuke/github-app-jwt-aws-kms";
import type { Client } from "@suzuki-shunsuke/github-app-token";

/**
 * Builds an Octokit client authenticated as the GitHub App.
 *
 * It's a function rather than a value because most code paths never need the
 * app, and building one without the inputs set is an error.
 */
export type NewAppOctokit = () => Client;

/**
 * Works out the AWS region of the KMS key.
 *
 * A key ARN carries its region, so csm_aws_region is only needed for an alias
 * name or a bare key id. The same region is used for the STS endpoint, so that
 * a job doesn't have to name it twice.
 */
const awsRegion = (keyId: string): string | undefined =>
  core.getInput("csm_aws_region") || regionFromKeyId(keyId) || undefined;

/**
 * Builds the AWS credentials used to call the KMS Sign API.
 *
 * When csm_aws_role_to_assume is set, the IAM role is assumed here with the
 * GitHub OIDC token, and the resulting credentials never leave this process.
 * Later steps of the job can't see them, unlike credentials that
 * aws-actions/configure-aws-credentials exports as environment variables or
 * writes to ~/.aws/credentials.
 *
 * Undefined leaves them to @suzuki-shunsuke/github-app-jwt-aws-kms, which reads
 * AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS_SESSION_TOKEN, so
 * aws-actions/configure-aws-credentials works as well.
 */
const newCredentials = (
  region: string | undefined,
): CredentialsProvider | undefined => {
  const roleArn = core.getInput("csm_aws_role_to_assume");
  if (!roleArn) {
    return undefined;
  }
  core.info(`assuming an AWS IAM role with the GitHub OIDC token: ${roleArn}`);
  return credentials({ roleArn, region });
};

/**
 * Builds an Octokit client authenticated as the GitHub App.
 *
 * When csm_aws_kms_key_id is set, the private key never leaves AWS KMS and only
 * the JSON Web Token signing is delegated to it. Otherwise csm_app_private_key
 * is used.
 *
 * The app is identified by either csm_client_id or csm_app_id.
 * @octokit/auth-app passes the value straight through as the JSON Web Token
 * issuer, and GitHub accepts both, recommending the Client ID.
 */
export const newAppOctokit: NewAppOctokit = () => {
  const appId = core.getInput("csm_client_id") || core.getInput("csm_app_id");
  if (!appId) {
    throw new Error("csm_client_id or csm_app_id is required");
  }
  const kmsKeyId = core.getInput("csm_aws_kms_key_id");
  if (kmsKeyId) {
    core.info(`signing GitHub App JSON Web Tokens with AWS KMS: ${kmsKeyId}`);
    const region = awsRegion(kmsKeyId);
    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId,
        createJwt: createJwt({
          keyId: kmsKeyId,
          region,
          credentials: newCredentials(region),
        }),
      },
    });
  }
  const privateKey = core.getInput("csm_app_private_key");
  if (!privateKey) {
    throw new Error(
      "csm_app_private_key or csm_aws_kms_key_id is required when csm_client_id or csm_app_id is provided",
    );
  }
  return new Octokit({
    authStrategy: createAppAuth,
    auth: { appId, privateKey },
  });
};
