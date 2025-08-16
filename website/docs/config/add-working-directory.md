---
sidebar_position: 150
---

# How to add a working directory

* Create [S3 Buckets](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket) or [Google Cloud Storage Buckets](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/storage_bucket)
  * For tfmigrate History files
* If you use AWS, Create AWS IAM Roles: https://github.com/suzuki-shunsuke/terraform-aws-tfaction
* If you use GCP, Create GCP Service Accounts
* Update [tfaction-root.yaml](/config/tfaction-root-yaml) if it is needed
* [Scaffold the working directory](/feature/scaffold-working-dir)

:::info
Since tfaction v0.7.0, the storage for Terraform Plan files have been migrated from S3 or GCS to GitHub Actions Artifacts.
So you don't have to create buckets and set permissions for them.

Please see [here](/feature/plan-file#tfaction-v070-migrated-plan-files-to-github-actions-artifacts) for the detail.
:::

## AWS IAM Role

To access AWS, tfaction uses [aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials).
tfaction supports configuring Assume Role per working directory type and build type.

e.g.

```yaml
- working_directory: github/services/
  # ...
  terraform_plan_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_terraform_plan
  tfmigrate_plan_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_tfmigrate_plan
  terraform_apply_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_terraform_apply
  tfmigrate_apply_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_tfmigrate_apply
```

* tfmigrate_plan: Assume Role for [tfmigrate-plan](https://github.com/suzuki-shunsuke/tfaction/tree/main/tfmigrate-plan)
* tfmigrate_apply: Assume Role for [tfmigrate-apply](https://github.com/suzuki-shunsuke/tfaction/tree/main/tfmigrate-apply)
* terraform_plan: Assume Role for [terraform-plan](https://github.com/suzuki-shunsuke/tfaction/tree/main/terraform-plan)
* terraform_apply: Assume Role for [terraform-apply](https://github.com/suzuki-shunsuke/tfaction/tree/main/terraform-apply)

We provide a Terraform Module to create these IAM Roles.

https://github.com/suzuki-shunsuke/terraform-aws-tfaction

## Required Permission

### terraform_plan

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::<S3 Bucket for Plan File>/*"
        }
    ]
}
```

### terraform_apply

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject"
            ],
            "Resource": "arn:aws:s3:::<S3 Bucket for Plan File>/*"
        }
    ]
}
```

### tfmigrate_plan

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject"
            ],
            "Resource": "arn:aws:s3:::<S3 Bucket for tfmigrate history>/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::<S3 Bucket for tfmigrate history>"
        }
    ]
}
```

### tfmigrate_apply

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject"
            ],
            "Resource": "arn:aws:s3:::<S3 Bucket for tfmigrate history>/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::<S3 Bucket for tfmigrate history>"
        }
    ]
}
```

## GCP

To access GCP, tfaction uses [google-github-actions/auth](https://github.com/google-github-actions/auth).
tfaction supports configuring Service Accounts per working directory type and build type.

e.g.

```yaml
- working_directory: github/services/
  # ...
  terraform_plan_config:
    gcp_service_account: terraform-plan@my-project.iam.gserviceaccount.com
    gcp_workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
  tfmigrate_plan_config:
    gcp_service_account: tfmigrate-plan@my-project.iam.gserviceaccount.com
    gcp_workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
  terraform_apply_config:
    gcp_service_account: terraform-apply@my-project.iam.gserviceaccount.com
    gcp_workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
  tfmigrate_apply_config:
    gcp_service_account: tfmigrate-apply@my-project.iam.gserviceaccount.com
    gcp_workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
```
