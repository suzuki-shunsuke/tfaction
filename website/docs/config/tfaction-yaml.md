---
sidebar_position: 200
---

# tfaction.yaml

## JSON Schema

- [JSON Schema](https://github.com/suzuki-shunsuke/tfaction/blob/main/schema/tfaction.json)
- [Generated document from JSON Schema](https://suzuki-shunsuke.github.io/tfaction/config/tfaction.html)

### 💡 Input Complementation by YAML Language Server

Add a code comment to tfaction.yaml:

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/suzuki-shunsuke/tfaction/refs/heads/latest/schema/tfaction.json
```

If you specify a branch like `latest` as version, editors can't reflect the update of JSON Schema well as they cache JSON Schema.
You would need to do something like reopening the file.
So it's good to specify semver and update it periodically.

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/suzuki-shunsuke/tfaction/refs/tags/v1.15.5/schema/tfaction.json
```

Using Renovate and our Renovate Config Preset, you can automate the update:

```json
{
  "extends": [
    "github>suzuki-shunsuke/renovate-config:yaml-language-server#3.1.0"
  ]
}
```

---

Please add `tfaction.yaml` in each working directory for tfaction to detect working directories.

You can change the file name by the configuration `working_directory_file`.

All fields are optional.

```yaml
{}
```

You can override the configuration of `tfaction-root.yaml` by `tfaction.yaml`.

```yaml
aws_region:
s3_bucket_name_tfmigrate_history:
template_dir:
gcs_bucket_name_tfmigrate_history:
aws_assume_role_arn:
gcp_service_account:
gcp_workload_identity_provider:

# tfaction >= v1.5.0
# Google Cloud Service Account for Terraform Backend.
# By default, gcp_service_account and gcp_workload_identity_provider are used.
gcp_remote_backend_service_account: terraform@my-project.iam.gserviceaccount.com
gcp_remote_backend_workload_identity_provider: "projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider"

terraform_command: terraform
env:
  # Environment variables
  FOO: foo
secrets:
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

  env:
    # Environment variables
    FOO: foo
tfmigrate_plan_config:
  aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_tfmigrate_plan
terraform_apply_config:
  aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_terraform_apply
tfmigrate_apply_config:
  aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_tfmigrate_apply
drift_detection:
  enabled: false

# tfaction >= v1.8.0
conftest:
  disable_all: true
  policies:
    - policy: policy/tf
      tf: true
```
