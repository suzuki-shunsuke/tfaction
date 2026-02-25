---
sidebar_position: 500
---

# Configuration Priority

tfaction's configuration is hierarchical, and some settings can be defined in multiple places.

The priority order from highest to lowest is:

1. `tfaction.yaml` `.[terraform|tfmigrate]_[plan|apply]_config`
1. `tfaction.yaml` top level
1. `tfaction-root.yaml` `.target_groups[].[terraform|tfmigrate]_[plan|apply]_config`
1. `tfaction-root.yaml` `.target_groups[]`
1. `tfaction-root.yaml` top level

`tfaction.yaml` contains settings specific to each root module and takes precedence over `tfaction-root.yaml`.
Within `tfaction.yaml`, per-job-type settings (`terraform_plan_config`, `terraform_apply_config`, `tfmigrate_plan_config`, `tfmigrate_apply_config`) take even higher precedence.

`target_groups` in `tfaction-root.yaml` is a list of root module groups.
Each group's settings take precedence over the top-level settings in `tfaction-root.yaml` (which apply to all root modules).

```yaml
# tfaction.yaml

# Priority 2
aws_assume_role_arn: arn:aws:iam::123456789012:role/GitHubActions_Terraform_github_terraform_plan
terraform_plan_config:
  # Priority 1
  aws_assume_role_arn: arn:aws:iam::123456789012:role/GitHubActions_Terraform_github_terraform_plan
```

```yaml
# tfaction-root.yaml

# Priority 5
aws_assume_role_arn: arn:aws:iam::123456789012:role/GitHubActions_Terraform_github_terraform_plan
target_groups:
  - working_directory: ""
    # Priority 4
    aws_assume_role_arn: arn:aws:iam::123456789012:role/GitHubActions_Terraform_github_terraform_plan
    terraform_plan_config:
      # Priority 3
      aws_assume_role_arn: arn:aws:iam::123456789012:role/GitHubActions_Terraform_github_terraform_plan
```
