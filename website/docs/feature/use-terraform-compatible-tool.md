---
sidebar_position: 1110
description: Support tools like OpenTofu and Terragrunt
---

# Use a Terraform compatible tool

[#1554](https://github.com/suzuki-shunsuke/tfaction/pull/1554) tfaction >= [v1.2.0](https://github.com/suzuki-shunsuke/tfaction/releases/tag/v1.2.0)

## Overview

tfaction executes Terraform commands such as terraform init, fmt, validate, plan, apply, and so on.
You can also execute any tools compatible with Terraform instead of Terraform.
You can use tools such as [OpenTofu](https://opentofu.org/) and [Terragrunt](https://terragrunt.gruntwork.io/) instead of Terraform.

## How to use

You can specify a tool by the setting `terraform_command` in `tfaction-root.yaml` and `tfaction.yaml`.

tfaction-root.yaml

```yaml
terraform_command: tofu # terragrunt
target_groups:
  - working_directory: aws/
    terraform_command: tofu # terragrunt
```

tfaction.yaml

```yaml
terraform_command: tofu # terragrunt
```

Then the given command is executed instead of `terraform`.
For example, if `terraform_command` is `tofu`, commands such as tofu init, fmt, validate, plan, apply are executed instead of terraform.

## 💡 Combine OpenTofu and Terragrunt

You can also combine OpenTofu and Terragrunt.

1. Set `terraform_command` to `terragrunt`
2. Set the environment variable `TERRAGRUNT_TFPATH` to `tofu`

## 💡 Validate `terraform_command`

You can validate `terraform_command` in GitHub Actions Workflows.

e.g.

```yaml
- uses: suzuki-shunsuke/tfaction/get-target-config@v1.2.0
  id: target-config

- run: |
    echo "::error:: terraform_command is invalid"
    exit 1
  if: |
    ! contains(fromJSON('["terraform", "terragrunt", "tofu"]'), steps.target-config.outputs.terraform_command)
```
