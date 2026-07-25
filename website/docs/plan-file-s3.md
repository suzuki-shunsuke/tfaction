---
sidebar_position: 3550
---

# Store Plan Files in S3

:::info
This feature targets AWS. Google Cloud support may be added later.
It applies only to the `terraform` job type (`tfmigrate` does not use a plan-file artifact).
:::

By default tfaction uploads the [plan file](plan-file.md) to GitHub Artifacts.
GitHub Artifacts can be downloaded by anyone who can read the repository's Actions, so if a secret ends up in a plan file (for example a sensitive attribute captured in the plan, which embeds a state snapshot), it is exposed to everyone with that access.

When `plan_file_s3` is set, tfaction stores the plan file in an S3 bucket instead of GitHub Artifacts.
Only a small, non-sensitive metadata file is uploaded to GitHub Artifacts.

Restricting access to the bucket is the user's responsibility; tfaction does not enforce it.
You prevent secrets from leaking through plan files by properly restricting access to the S3 bucket with AWS IAM.
See [Restricting access with IAM](#restricting-access-with-iam) below.

AWS authentication is left to the user (tfaction is not involved), as with the rest of tfaction.
`plan` and `apply` are expected to use different IAM Roles, so both need to be configured.

## Configuration

```yaml title="tfaction-root.yaml"
plan_file_s3:
  bucket: my-plan-file-bucket
  # key_prefix is optional and defaults to tfaction_plan/
  key_prefix: tfaction_plan/
```

`plan_file_s3` can also be set on `target_groups[]` and `tfaction.yaml`, following the same [configuration priority](config-priority.md) as `s3_bucket_name_tfmigrate_history`.
This lets you use a different bucket per account or environment.
Setting `plan_file_s3` enables the feature; there is no separate enable flag.

## How it works

The plan file is stored in S3 with a key that is unique per workflow run id and attempt number:

```
<key_prefix><workflow run id>/<attempt number>/<terraform root module path>/plan.out
```

A self-describing metadata file is uploaded to GitHub Artifacts as `terraform_plan_meta_<terraform root module path with / replaced by __>.json`:

```json
{
  "storage": "s3",
  "bucket": "my-plan-file-bucket",
  "key_prefix": "tfaction_plan/1234/1/aws/dev/vpc/",
  "hash": {
    "plan": "<SHA-256 of plan.out>"
  },
  "summary": "create"
}
```

`apply` reads this metadata file (from the plan run that is bound by tfaction's existing head SHA check), pulls the plan file from S3, and verifies its SHA-256 against `hash.plan`.
If the hash does not match, `apply` aborts.
Because `apply` resolves the location from the metadata file rather than from its own configuration, changing the configuration or the bucket between plan and apply does not break resolution.

When `plan_file_s3` is not set, the metadata file records `"storage": "github-artifacts"` and the plan file stays in GitHub Artifacts as before.

## Restricting access with IAM

tfaction only chooses S3 as the storage; it does not enforce access control.
Preventing secrets from leaking through plan files is achieved by your IAM configuration:

- Use separate IAM Roles for `plan` and `apply`.
- Scope the `apply` IAM Role's OIDC trust so that it can be assumed only from the branch that runs `apply` (typically the default branch).
- Grant `s3:GetObject` only to the `apply` IAM Role.
- Grant the `plan` IAM Role, which can be assumed from any untrusted feature branch, `s3:PutObject` only. Do not grant it `s3:GetObject`.

This way the plan file can be read only in the trusted apply context, not from arbitrary pull request branches.

If `plan` and `apply` use roles in different AWS accounts, the bucket policy must allow PutObject from the plan account and GetObject from the apply account.
The S3 client region is resolved from the existing AWS authentication (`AWS_REGION`, etc.).

You should also configure a lifecycle rule on the bucket to expire old plan files.
GitHub Artifacts expire automatically, but S3 objects do not.

## Encryption

S3 can transparently encrypt objects (SSE-KMS, etc.), but tfaction does not get involved.
IAM-based access control alone already achieves the goal, and enabling encryption needs no special handling on the tfaction side.

## Limitations

Placing the plan file under S3 access control removes the property that anyone who can read the repository can download it.
This is the security goal, but as a downside it becomes harder for other jobs in the workflow to download and process the plan file.
A downstream step should either process the summary from the metadata file (as the plan-label action does), or run in the same job where the plan file is still available locally (for example the plan job).

Granting pull (`s3:GetObject`) permission to a job that runs at pull request time is not safe: pull requests can run from arbitrary branches and access cannot be restricted per pull request, so any branch would be able to read plan files from S3, defeating the confidentiality goal.
Keep the pull permission confined to the trusted apply context.
