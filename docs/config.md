# Configuration

tfaction.yaml

```yaml
---
targets:
- working_directory: aws/
  target: aws/
  aws_region: ap-northeast-1
  s3_bucket_name_plan_file: '<S3 Bucket Name for Terraform Plan File>'
  s3_bucket_name_tfmigrate_history: '<S3 Bucket Name for tfmigrate history files>'
  template_dir: templates/aws
  assume_role_arns:
    tfmigrate_plan: arn:aws:iam::000000000000:role/GitHubActionsTerraformPR
    terraform_plan: arn:aws:iam::000000000000:role/GitHubActionsTerraformPR
    tfmigrate_apply: arn:aws:iam::000000000000:role/GitHubActionsTerraformMain
    terraform_apply: arn:aws:iam::000000000000:role/GitHubActionsTerraformMain

- working_directory: github/services/
  target: github/
  aws_region: ap-northeast-1
  s3_bucket_name_plan_file: '<S3 Bucket Name for Terraform Plan File>'
  s3_bucket_name_tfmigrate_history: '<S3 Bucket Name for tfmigrate history files>'
  template_dir: templates/github
  assume_role_arns:
    tfmigrate_plan: arn:aws:iam::000000000000:role/GitHubActionsTerraformPRGitHub
    terraform_plan: arn:aws:iam::000000000000:role/GitHubActionsTerraformPRGitHub
    tfmigrate_apply: arn:aws:iam::000000000000:role/GitHubActionsTerraformMainGitHub
    terraform_apply: arn:aws:iam::000000000000:role/GitHubActionsTerraformMainGitHub

renovate_login: 'renovate[bot]'
label_prefixes:
  target: "target:" # default is "target:"
  tfmigrate: "tfmigrate:" # default is "tfmigrate:"
  ignore: "ignore:" # default is "ignore:"
```

## Environment Variables

name | default | description
--- | --- | ---
TFACTION_CONFIG | tfaction.yaml | configuration file path
TFACTION_TARGET | | target
TFACTION_IS_APPLY | | `true` or `false`. Whether `terraform apply` or `tfmigrate apply` are run
