---
sidebar_position: 200
---

# tfaction-root.yaml

## JSON Schema

- [JSON Schema](https://github.com/suzuki-shunsuke/tfaction/blob/latest/schema/tfaction-root.json)
- [Generated document from JSON Schema](https://suzuki-shunsuke.github.io/tfaction/config/tfaction-root.html)

### 💡 Input Complementation by YAML Language Server

Add a code comment to tfaction-root.yaml:

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/suzuki-shunsuke/tfaction/refs/heads/latest/schema/tfaction-root.json
```

If you specify a branch like `latest` as version, editors can't reflect the update of JSON Schema well as they cache JSON Schema.
You would need to do something like reopening the file.
So it's good to specify semver and update it periodically.

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/suzuki-shunsuke/tfaction/refs/tags/v1.15.5/schema/tfaction-root.json
```

Using Renovate and our Renovate Config Preset, you can automate the update:

```json
{
  "extends": [
    "github>suzuki-shunsuke/renovate-config:yaml-language-server#3.1.0"
  ]
}
```

## `plan_workflow_name`

From tfaction v0.7.0, this setting is required.

```yaml
plan_workflow_name: <GitHub Actions Workflow name running terraform-plan action>
```

e.g.

```yaml
plan_workflow_name: test
```

## `target` and `working_directory`

tfaction assumes that there are multiple working directories in the repository.
Working directory is a directory where terraform commands such as `terraform init`, `terraform plan`, and `terraform apply` are run.
tfaction treats directories where `tfaction.yaml` is located as working directories.
Working directory has an attribute `target`, which is an identifier of the working directory. `target` must be unique.
`target` is used in pull request comments and labels and the input of [scaffold working directory](/feature/scaffold-working-dir).
The attribute `working_directory` of the working directory is a relative file path to the working directory.

## `target_groups`

`target_groups` is a list of target group configuration.
tfaction searches the configuration of the working directory from `target_groups`.
Target Group Configuration has attributes `working_directory` and `target`.
If the Target Group's `working_directory` is the prefix of the working directory's `working_directory`,
or the Target Group's `target` is the prefix of the working directory's `target`,
the Target Group's configuration is used as the working directory's configuration and the search is stopped.

The order of `target_groups` is important.

```yaml
target_groups:
  - working_directory: aws/
    target: aws/
    # ...
  - working_directory: aws/foo/ # This configuration is never used.
    target: aws/foo/
    # ...
```

## Example

```yaml
---
plan_workflow_name: test

draft_pr: true # default is false. If `draft_pr` is true, tfaction creates pull requests as draft
base_working_directory: "" # default is empty, which means the current directory
working_directory_file: tfaction.yaml # default is "tfaction.yaml"

# tfaction v1.16.0
# https://github.com/suzuki-shunsuke/tfaction/pull/2431
follow_up_pr_group_label:
  enabled: true # The default is false
  prefix: "tfaction:follow-up-pr-group/"

# conftest_policy_directory: tfaction >= v1.1.0
# conftest_policy_directory is the file path to the conftest policy directory.
# The default value is "policy".
# If conftest_policy_directory isn't set and the directory policy doesn't exist, conftest is skipped.
# If conftest_policy_directory is set but the directory doesn't exist, the action fails.
conftest_policy_directory: terraform/policy

renovate_login: 'renovate[bot]' # default is "renovate[bot]"
label_prefixes:
  target: "target:" # default is "target:"
  tfmigrate: "tfmigrate:" # default is "tfmigrate:"
  skip: "skip:" # default is "skip:"

aqua:
  update_checksum:
    # Update aqua-checksums.json in `setup` action
    enabled: true # default is false
    skip_push: false # default is false
    prune: true # default is false

# tfaction >= v1.3.0
# https://suzuki-shunsuke.github.io/tfaction/docs/feature/local-path-module
# https://github.com/suzuki-shunsuke/tfaction/pull/1528
update_local_path_module_caller:
  enabled: true

# tfaction >= v1.17.0
# https://github.com/suzuki-shunsuke/tfaction/pull/2744
limit_changed_dirs:
  working_dirs: 5 # The maximum number of changed working directories in one pull request. By default, there is no limit
  modules: 5 # The maximum number of changed modules in one pull request. By default, there is no limit

env:
  # Environment variables
  # <environment variable name>: <value>
  FOO: foo

# https://github.com/suzuki-shunsuke/tfaction/pull/1106
# tfsec:
#   enabled: true
# tflint:
#   enabled: true
#   fix: true # tfaction >= v1.13.0
# trivy:
#   enabled: false

# We don't recommend disabling this feature.
# update_related_pull_requests:
#   enabled: false

# tfaction >= v0.5.25
# https://github.com/suzuki-shunsuke/tfaction/pull/910
# scaffold_working_directory:
#   skip_adding_aqua_packages: true

# tfaction >= v0.6.0
drift_detection:
  enabled: false
  issue_repo_owner: suzuki-shunsuke
  issue_repo_name: tfaction-example
  num_of_issues: 1
  minimum_detection_interval: 1

terraform_command: terraform

# tfaction >= v1.8.0
conftest:
  policies:
    - policy: policy/plan
      plan: true

target_groups:
- working_directory: aws/
  target: aws/
  aws_region: ap-northeast-1
  s3_bucket_name_tfmigrate_history: '<S3 Bucket Name for tfmigrate history files>'
  template_dir: templates/aws # This is used by `scaffold-working-dir` action
  terraform_command: terraform
  drift_detection:
    enabled: true
  terraform_plan_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_terraform_plan

    # AWS IAM Role Session Name
    # tfaction >= v1.11.0
    # This is optional.
    # The maximum length of the session name is 64.
    # And it must satisfy regular expression pattern `[\w+=,.@-]*`.
    # The default value of session name is
    # 1. tfaction-{plan or apply}-{normalized target}-${GitHub Actions Run ID}
    # 2. tfaction-{plan or apply}-{normalized target}
    # 3. tfaction-{plan or apply}-${GitHub Actions Run ID}
    # 4. tfaction-{plan or apply}
    # / in the default targets are converted to `_`.
    # And if target is too long, it is removed from the default session name.
    aws_role_session_name: tfplan

  tfmigrate_plan_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_tfmigrate_plan
  terraform_apply_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_terraform_apply
  tfmigrate_apply_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_tfmigrate_apply

- working_directory: github/services/
  target: github/
  aws_region: ap-northeast-1
  s3_bucket_name_tfmigrate_history: '<S3 Bucket Name for tfmigrate history files>'
  template_dir: templates/github
  aws_secrets_manager:
  env:
    # Environment variables
    FOO: foo
  # export AWS Secrets Manager's secret as environment variable
  - secret_id: bar
    envs:
    - env_name: BAR
  terraform_plan_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_github_terraform_plan
    env:
      # Environment variables
      FOO: foo
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
  template_dir: templates/github

  # runs_on is GitHub Actions jobs' `runs-on`.
  # https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idruns-on
  # https://github.com/suzuki-shunsuke/tfaction-example/blob/b8a1740fb881ed8753dba8c76f5df521f1a71dde/.github/workflows/apply.yaml#L29
  # The default value is "ubuntu-latest".
  # Either a string or an array of strings.
  # This is useful to use a GitHub Actions Self Hosted Runner for the specific provider
  runs_on: ubuntu-latest
  # runs_on: [self-hosted, linux, x64, gpu]

  environment: # default is null
    # https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment
    name: production
    url: https://github.com
  secrets: # GitHub Secrets
  - env_name: FOO # Environment variable name
    secret_name: FOO_STAGING # Secret name

  gcs_bucket_name_tfmigrate_history: '<Google Cloud Storage Bucket Name for tfmigrate history files>'

  # tfaction >= v1.5.0
  # Google Cloud Service Account for Terraform Backend.
  # By default, gcp_service_account and gcp_workload_identity_provider are used.
  gcp_remote_backend_service_account: terraform@my-project.iam.gserviceaccount.com
  gcp_remote_backend_workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'

  terraform_plan_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_gcp_terraform_plan
    gcp_service_account: terraform@my-project.iam.gserviceaccount.com
    gcp_workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'

    # https://github.com/suzuki-shunsuke/tfaction/discussions/1325
    gcp_access_token_scopes: 'https://www.googleapis.com/auth/cloud-platform, https://www.googleapis.com/auth/userinfo.email, https://www.googleapis.com/auth/apps.groups.settings, https://www.googleapis.com/auth/admin.directory.group'
  tfmigrate_plan_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_gcp_tfmigrate_plan
    gcp_service_account: terraform@my-project.iam.gserviceaccount.com
    gcp_workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'

    # https://github.com/suzuki-shunsuke/tfaction/discussions/1325
    gcp_access_token_scopes: 'https://www.googleapis.com/auth/cloud-platform, https://www.googleapis.com/auth/userinfo.email, https://www.googleapis.com/auth/apps.groups.settings, https://www.googleapis.com/auth/admin.directory.group'
  terraform_apply_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_gcp_terraform_apply
    gcp_service_account: terraform@my-project.iam.gserviceaccount.com
    gcp_workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'

    # https://github.com/suzuki-shunsuke/tfaction/discussions/1325
    gcp_access_token_scopes: 'https://www.googleapis.com/auth/cloud-platform, https://www.googleapis.com/auth/userinfo.email, https://www.googleapis.com/auth/apps.groups.settings, https://www.googleapis.com/auth/admin.directory.group'
  tfmigrate_apply_config:
    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_gcp_tfmigrate_apply
    gcp_service_account: terraform@my-project.iam.gserviceaccount.com
    gcp_workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'

    # https://github.com/suzuki-shunsuke/tfaction/discussions/1325
    gcp_access_token_scopes: 'https://www.googleapis.com/auth/cloud-platform, https://www.googleapis.com/auth/userinfo.email, https://www.googleapis.com/auth/apps.groups.settings, https://www.googleapis.com/auth/admin.directory.group'
```
