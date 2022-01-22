# Configuration

`tfaction-root.yaml`

```yaml
---
targets:
- working_directory: aws/
  target: aws/
  aws_region: ap-northeast-1
  s3_bucket_name_plan_file: '<S3 Bucket Name for Terraform Plan File>'
  s3_bucket_name_tfmigrate_history: '<S3 Bucket Name for tfmigrate history files>'
  template_dir: templates/aws
  aws_assume_role_arns:
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
  aws_assume_role_arns:
    tfmigrate_plan: arn:aws:iam::000000000000:role/GitHubActionsTerraformPRGitHub
    terraform_plan: arn:aws:iam::000000000000:role/GitHubActionsTerraformPRGitHub
    tfmigrate_apply: arn:aws:iam::000000000000:role/GitHubActionsTerraformMainGitHub
    terraform_apply: arn:aws:iam::000000000000:role/GitHubActionsTerraformMainGitHub

base_working_directory: ""
working_directory_file: tfaction.yaml # default is "tfaction.yaml"
renovate_login: 'renovate[bot]'
label_prefixes:
  target: "target:" # default is "target:"
  tfmigrate: "tfmigrate:" # default is "tfmigrate:"
  ignore: "ignore:" # default is "ignore:"
```

## Environment Variables

name | default | description
--- | --- | ---
TFACTION_CONFIG | `tfaction-root.yaml` | configuration file path
TFACTION_TARGET | | target
TFACTION_IS_APPLY | | `true` or `false`. Whether `terraform apply` or `tfmigrate apply` are run

## `tfaction.yaml`

Please add `tfaction.yaml` in each working directory for tfaction to detect working directories.
Currently, these files are used only for the detection of working directories,
so it has no problem even if the content is empty.

You can change the file name by the configuration `working_directory_file`.

## github-comment.yaml

tfaction uses [github-comment](https://github.com/suzuki-shunsuke/github-comment), which is a CLI tool to post and hide comments of GitHub Commits, Issues, and Pull Requests.
You have to configure some comment templates.

* post
  * renovate-plan-change
* exec
  * tfmigrate-plan
  * tfmigrate-apply
  * conftest

e.g. https://github.com/suzuki-shunsuke/tfaction-example/blob/main/github-comment.yaml

## aqua.yaml

tfaction uses [aqua](https://aquaproj.github.io/), which is a Declarative CLI Version Manager written in Go.

Please add configuration file for aqua.

e.g.

* https://github.com/suzuki-shunsuke/tfaction-example/blob/main/aqua.yaml
* https://github.com/suzuki-shunsuke/tfaction-example/tree/main/aqua

You can change tool versions per working directory too.

e.g.

* https://github.com/suzuki-shunsuke/tfaction-example/blob/main/github/services/foo/aqua.yaml
* https://github.com/suzuki-shunsuke/tfaction-example/tree/main/github/services/foo/aqua
