# get-target-config

GitHub Actions to get target configuration

## Example

```yaml
- uses: suzuki-shunsuke/tfaction/get-target-config@main
  id: target-config
  with:
    target: github/foo
    config: config.yaml
    is_apply: 'false'
```

## Inputs

### Required Inputs

name | type | description
--- | --- | ---
target | string | target
config | string (file path) | configuration file path
is_apply | string (`true` or `false`) | whether the apply is run

### Optional Inputs

Nothing.

## Outputs

name | type | description
--- | --- | ---
working_directory | string (file path) | Working Directory
assume_role_arn | string | AWS Assume Role ARN
aws_region | string | AWS Region
s3_bucket_name_plan_file | string (S3 Bucket Name) | S3 Bucket Name for Terraform Plan files
s3_bucket_name_tfmigrate_history | string (S3 Bucket Name) | S3 Bucket Name for tfmigrate History files
