# get-target-config

GitHub Actions to get target configuration

## Example

```yaml
envs:
  TFACTION_TARGET: foo
  TFACTION_IS_APPLY: 'false'
steps:
- uses: suzuki-shunsuke/tfaction/get-target-config@main
  id: target-config
```

## Inputs

Nothing.

## Outputs

name | description
--- | ---
working_directory | Working Directory
aws_assume_role_arn | AWS Assume Role ARN
aws_region | AWS Region
gcp_service_account | Google Cloud Platform Service Account for [GCP Workload Identity Federation](https://github.com/google-github-actions/auth)
gcp_workload_identity_provider | Google Cloud Platform Identity Provider for [GCP Workload Identity Federation](https://github.com/google-github-actions/auth)
s3_bucket_name_plan_file | S3 Bucket Name for Terraform Plan files
s3_bucket_name_tfmigrate_history | S3 Bucket Name for tfmigrate History files
template_dir | working directory template directory path
