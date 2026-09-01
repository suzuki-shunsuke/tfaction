---
sidebar_position: 3300
---

# tfmigrate

Run [tfmigrate](https://github.com/minamijoyo/tfmigrate) through GitHub Actions to perform state migrations as code.
While the need for tfmigrate has decreased since Terraform added official support for moved blocks, removed blocks, and import blocks, it remains useful for cases such as moving resources between states.

To run tfmigrate with tfaction, create tfmigrate configuration files and migration files, then add a label to the PR.
tfaction provides a workflow to simplify this process.

## Creating the Workflow

Running this workflow creates a PR with tfmigrate configuration files and migration files for a specified directory.
If you specify the `pr_number` input, it commits to an existing PR instead of creating a new one.

```yaml title=".github/workflows/scaffold_tfmigrate.yaml"
name: Scaffold tfmigrate
on:
  workflow_dispatch:
    inputs:
      working_directory:
        description: working directory
        required: true
      migration_name:
        description: 'migration name. e.g. "import_foo"'
        required: true
      pr_number:
        description: "PR number"
        required: false
env:
  TFACTION_WORKING_DIR: ${{inputs.working_directory}}
jobs:
  scaffold:
    timeout-minutes: 10
    permissions:
      contents: read
    runs-on: ubuntu-24.04
    steps:
      - name: Checkout Repository
        uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1
        with:
          persist-credentials: false

      - name: Create GitHub App installation access token
        uses: actions/create-github-app-token@29824e69f54612133e76f7eaac726eef6c875baf # v2.2.1
        id: token
        with:
          app-id: ${{ vars.APP_ID }}
          private-key: ${{ secrets.PRIVATE_KEY }}
          permission-contents: write
          permission-pull-requests: write

      - name: Create PR
        uses: suzuki-shunsuke/tfaction@latest
        with:
          action: scaffold-tfmigrate
          github_token: ${{steps.token.outputs.token}}
          migration_name: ${{inputs.migration_name}}
          pr_number: ${{inputs.pr_number}}
```

## tfaction-root.yaml

When using the AWS Provider, configure the IAM Role for tfmigrate.
Also configure the S3 Bucket for storing tfmigrate history.

```yaml title="tfaction-root.yaml"
target_groups:
  - working_directory: ""
    aws_region: ap-northeast-1
    s3_bucket_name_tfmigrate_history: <bucket name>
    tfmigrate_plan_config:
      aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_tfmigrate_plan
    tfmigrate_apply_config:
      aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_tfmigrate_apply
```

## Moving Resources Across States

tfmigrate supports moving resources between different states.
When doing this with tfaction, use an ignore label to prevent terraform plan from running.

For example, suppose you are moving resources from working directory `foo` to `bar` and running tfmigrate in `foo`.
Both `foo` and `bar` require code changes, so CI runs in both directories.
In `foo`, tfmigrate moves the resources from `foo` to `bar`, but in `bar`, terraform plan and apply would also run.
By adding an `ignore:bar` label, you can prevent terraform plan and apply from running in `bar`.
