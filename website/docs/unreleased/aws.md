---
sidebar_position: 1200
---

# Configuration for AWS

This page explains the configuration for using the AWS Provider and S3 Backend.
If you do not use these, you can skip this page.

When using these, you need to authenticate before running terraform init.

## IAM Role Configuration

Configure the IAM Role to assume in tfaction-root.yaml or tfaction.yaml.

```yaml
target_groups:
  - working_directory: ""
    aws_region: ap-northeast-1
    terraform_plan_config:
      aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_terraform_plan
    terraform_apply_config:
      aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_terraform_apply
```

Because you can use separate IAM Roles for terraform plan and apply, you can use a read-only IAM Role for plan and an IAM Role with stronger permissions for apply.

In tfaction v1, the `setup` action executed [aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials).
Starting from v2, it is no longer executed automatically, so you need to run it yourself.

```yaml
- name: Set up
  uses: suzuki-shunsuke/tfaction@latest
  id: setup
  with:
    action: setup
    github_token: ${{steps.generate_token.outputs.token}}

- uses: aws-actions/configure-aws-credentials@61815dcd50bd041e203e49132bacad1fd04d2708 # v5.1.1
  if: steps.setup.outputs.aws_assume_role_arn != ''
  with:
    role-to-assume: ${{ steps.setup.outputs.aws_assume_role_arn }}
    role-session-name: ${{ steps.setup.outputs.aws_role_session_name }}
    aws-region: ${{ steps.setup.outputs.aws_region }}

- name: terraform init
  uses: suzuki-shunsuke/tfaction@latest
  with:
    action: terraform-init
```

## Using the Terraform Module

You can use https://github.com/suzuki-shunsuke/terraform-aws-tfaction to create IAM Roles with the minimum required permissions.
However, using this module is not mandatory.

## OIDC

You can assume an IAM Role from GitHub Actions using OIDC.
This is not directly related to tfaction, so the details are omitted here.

https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws
