# Configuration

`tfaction-root.yaml`

```yaml
---
draft_pr: true # default is false. If `draft_pr` is true, tfaction creates pull requests as draft
base_working_directory: "" # default is empty, which means the current directory
working_directory_file: tfaction.yaml # default is "tfaction.yaml"
renovate_login: 'renovate[bot]' # default is "renovate[bot]"
label_prefixes:
  target: "target:" # default is "target:"
  tfmigrate: "tfmigrate:" # default is "tfmigrate:"
  ignore: "ignore:" # default is "ignore:"

target_groups:
- working_directory: aws/
  target: aws/
  aws_region: ap-northeast-1
  s3_bucket_name_plan_file: '<S3 Bucket Name for Terraform Plan File>'
  s3_bucket_name_tfmigrate_history: '<S3 Bucket Name for tfmigrate history files>'
  template_dir: templates/aws # This is used by `scaffold-working-dir` action
  terraform_plan_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_terraform_plan
  tfmigrate_plan_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_tfmigrate_plan
  terraform_apply_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_terraform_apply
  tfmigrate_apply_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_tfmigrate_apply

- working_directory: github/services/
  target: github/
  aws_region: ap-northeast-1
  s3_bucket_name_plan_file: '<S3 Bucket Name for Terraform Plan File>'
  s3_bucket_name_tfmigrate_history: '<S3 Bucket Name for tfmigrate history files>'
  template_dir: templates/github
  aws_secrets_manager:
  # export AWS Secrets Manager's secret as environment variable
  - secret_id: bar
    envs:
    - env_name: BAR
  terraform_plan_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_github_terraform_plan
  tfmigrate_plan_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_github_tfmigrate_plan
  terraform_apply_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_github_terraform_apply
    aws_secrets_manager:
    # export AWS Secrets Manager's secret as environment variable
    - secret_id: atlas_api_key
      envs:
      - env_name: ATLAS_API_PUBLIC_KEY
        secret_key: public_key
      - env_name: ATLAS_API_PRIVATE_KEY
        secret_key: private_key
  tfmigrate_apply_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_github_tfmigrate_apply

- working_directory: gcp/
  target: gcp/
  aws_region: ap-northeast-1
  s3_bucket_name_tfmigrate_history: '<S3 Bucket Name for tfmigrate history files>'
  template_dir: templates/github
  runs_on: ubuntu-latest # default is "ubuntu-latest". This is useful to use GitHub Actions Self Hosted Runner for the specific provider
  environment: # default is null
    # https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment
    name: production
    url: https://github.com
  secrets: # GitHub Secrets
  - env_name: FOO # Environment variable name
    secret_name: FOO_STAGING # Secret name

  gcs_bucket_name_plan_file: '<Google Cloud Storage Bucket Name for Terraform Plan File>'
  terraform_plan_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_gcp_terraform_plan
    gcp_service_account: terraform@my-project.iam.gserviceaccount.com
    gcp_workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
  tfmigrate_plan_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_gcp_tfmigrate_plan
    gcp_service_account: terraform@my-project.iam.gserviceaccount.com
    gcp_workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
  terraform_apply_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_gcp_terraform_apply
    gcp_service_account: terraform@my-project.iam.gserviceaccount.com
    gcp_workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
  tfmigrate_apply_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_gcp_tfmigrate_apply
    gcp_service_account: terraform@my-project.iam.gserviceaccount.com
    gcp_workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
```

## Environment Variables

name | default | description
--- | --- | ---
TFACTION_CONFIG | `tfaction-root.yaml` | configuration file path
TFACTION_TARGET | | target
TFACTION_IS_APPLY | | `true` or `false`. Whether `terraform apply` or `tfmigrate apply` are run
TFACTION_JOB_TYPE | | `terraform` or `tfmigrate`

## `tfaction.yaml`

Please add `tfaction.yaml` in each working directory for tfaction to detect working directories.
Currently, these files are used only for the detection of working directories,
so it has no problem even if the content is empty.

You can change the file name by the configuration `working_directory_file`.

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

## GitHub Access Token

tfaction requires GitHub Access Token.

Due to the restriction of the repository's GITHUB_TOKEN, tfaction requires other GitHub Access Token too.

https://docs.github.com/en/actions/security-guides/automatic-token-authentication#using-the-github_token-in-a-workflow

> When you use the repository's GITHUB_TOKEN to perform tasks, events triggered by the GITHUB_TOKEN will not create a new workflow run.

We recommend using GitHub App's Token instead of Personal Access Token.

There are some GitHub Actions to create GitHub App's Access Token.

* https://github.com/tibdex/github-app-token
* https://github.com/cybozu/octoken-action

### Required permissions of Repository's GITHUB_TOKEN

https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#permissions

name | permission | description
--- | --- | ---
id-token | write | For [aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials)
contents | read | Checkout
issues | read | `gh pr list`'s `-l` option requires the read premission
pull-requests | write | pull request labels

### Required permissions of GitHub App

name | permission | description
--- | --- | ---
Contents | write | create commits and branches
Pull Requests | write | open pull requests

### Create GitHub App

Please see the official document. https://docs.github.com/en/developers/apps/building-github-apps/creating-a-github-app

## gsutil authentication

If you configure `gcs_bucket_name_plan_file`, tfaction stores Terraform Plan files at Google Cloud Storage with [gsutil](https://cloud.google.com/storage/docs/gsutil).
gsutil doesn't support Workload Identity Federation yet, so you have to use traditional service account key authentication.

* https://cloud.google.com/storage/docs/authentication
* https://github.com/google-github-actions/auth#authenticating-via-workload-identity-federation

> The bq and gsutil tools do no currently support Workload Identity Federation! You will need to use traditional service account key authentication for now.

## Secrets Management

tfaction supports two types of secrets management.

1. [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
1. [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)

### GitHub Secrets

You can export GitHub Secrets as environment variables with [export-secrets](export-secrets) Action.

```yaml
- uses: suzuki-shunsuke/tfaction/export-secrets@main
  with:
    secrets: ${{ toJSON(secrets) }}
```

Target Group Configuration

e.g.

```yaml
target_groups:
- working_directory: atlas/staging/
  # ...
  secrets:
  # export the secret `ATLAS_API_KEY_STAGING` as the environment variable `ATLAS_API_KEY`
  - env_name: ATLAS_API_KEY
    secret_name: ATLAS_API_KEY_STAGING
```

Job Configuration

e.g.

```yaml
target_groups:
- working_directory: atlas/staging/
  # ...
  terraform_plan_config:
    # ...
    secrets:
    - env_name: ATLAS_API_KEY
      secret_name: ATLAS_API_KEY_STAGING_READ_ONLY
```

### AWS Secrets Manager

You can export AWS Secrets Manager's Secrets as environment variables with [export-aws-secrets-manager](export-aws-secrets-manager) Action.
This action is used in [setup](setup) Action, so you don't have to use this Action explicitly.

Target Group Configuration

e.g.

```yaml
target_groups:
- working_directory: foo/
  # ...
  aws_secrets_manager:
  - secret_id: foo
    envs:
    - env_name: FOO_API_KEY
    # if `secret_key` isn't specified, the whole secret value is exported
```

```yaml
target_groups:
- working_directory: atlas/
  # ...
  aws_secrets_manager:
  - secret_id: atlas
    envs:
    - env_name: ATLAS_API_PUBLIC_KEY
      secret_key: public_key
    - env_name: ATLAS_API_PRIVATE_KEY
      secret_key: private_key
      # if `secret_key` is specified, the secret value is treated as JSON and the specified key is exported
```

Job Configuration

```yaml
target_groups:
- working_directory: atlas/
  # ...
  terraform_plan_config:
    # ...
    aws_secrets_manager:
    - secret_id: atlas
      envs:
      - env_name: ATLAS_API_PUBLIC_KEY
        secret_key: public_key
      - env_name: ATLAS_API_PRIVATE_KEY
        secret_key: private_key
```
