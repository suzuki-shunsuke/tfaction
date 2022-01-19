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

name | environment variable | default | description
--- | --- | --- | ---
target | TFACTION_TARGET | | target
is_apply | TFACTION_IS_APPLY | | `true` or `false`. Whether the apply is run
config | TFACTION_CONFIG | `tfaction.yaml` | configuration file path

## Outputs

name | type | description
--- | --- | ---
working_directory | string (file path) | Working Directory
assume_role_arn | string | AWS Assume Role ARN
aws_region | string | AWS Region
s3_bucket_name_plan_file | string (S3 Bucket Name) | S3 Bucket Name for Terraform Plan files
s3_bucket_name_tfmigrate_history | string (S3 Bucket Name) | S3 Bucket Name for tfmigrate History files
template_dir | string (file path) | working directory template directory path
