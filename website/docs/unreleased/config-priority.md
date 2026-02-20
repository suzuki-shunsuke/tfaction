---
sidebar_position: 500
---

# Configuration Priority

tfaction's configuration has a hierarchy, and some settings can be defined in multiple places.

The priority order from highest to lowest is as follows:

1. tfaction.yaml `.[terraform|tfmigrate]_[plan|apply]_config`
1. tfaction.yaml top level
1. tfaction-root.yaml `.target_groups[].[terraform|tfmigrate]_[plan|apply]_config`
1. tfaction-root.yaml `.target_groups[]`
1. tfaction-root.yaml top level

tfaction.yaml contains settings specific to each root module and takes priority over tfaction-root.yaml.
Within tfaction.yaml, settings for each of terraform plan, apply, tfmigrate plan, and apply take even higher priority.

In tfaction-root.yaml, target_groups is a list of grouped root modules.
Each group's settings take priority over the top-level settings in tfaction-root.yaml (which are shared across all root modules).

```yaml:tfaction.yaml
# 2
aws_assume_role_arn: arn:aws:iam::123456789012:role/GitHubActions_Terraform_github_terraform_plan
terraform_plan_config:
  # 1
  aws_assume_role_arn: arn:aws:iam::123456789012:role/GitHubActions_Terraform_github_terraform_plan
```

```yaml:tfaction-root.yaml
# 5
aws_assume_role_arn: arn:aws:iam::123456789012:role/GitHubActions_Terraform_github_terraform_plan
target_groups:
  - working_directory: ""
    # 4
    aws_assume_role_arn: arn:aws:iam::123456789012:role/GitHubActions_Terraform_github_terraform_plan
    terraform_plan_config:
      # 3
      aws_assume_role_arn: arn:aws:iam::123456789012:role/GitHubActions_Terraform_github_terraform_plan
```
