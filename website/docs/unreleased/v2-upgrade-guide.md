---
sidebar_position: 3700
---

# v2 Upgrade Guide

The v2 upgrade includes several breaking changes.
All tfaction users need to address these changes.

## Let a coding agent handle the upgrade

You can have a coding agent such as Claude Code perform the upgrade by providing the official upgrade guide.

:::warning
Accuracy depends on the model, and LLMs may make incorrect changes.
Always review the changes manually.
:::

```
Upgrade tfaction to v2 according to the guide.
```

## Summary

- GitHub Actions Workflow changes
  - Migrate `suzuki-shunsuke/tfaction/*` to `suzuki-shunsuke/tfaction` and add the `action` input
  - If AWS or Google Cloud authentication is required, explicitly run `aws-actions/configure-aws-credentials` or `google-github-actions/auth`
  - Remove the feature that exports secrets as environment variables via export-secrets or export-aws-secrets-manager
  - Migrate tfaction-go to `suzuki-shunsuke/tfaction/*`
  - Add the `TFACTION_SKIP_TERRAFORM` environment variable to jobs
  - Remove module testing jobs that use `test-module`
  - Remove workflows that use scaffold-module or create-scaffold-module-pr
  - Remove SSH Key configuration
  - Add update-pr-branch action after apply action
- tfaction-root.yaml changes
  - If `plan_workflow_name` specifies a workflow name, change it to a file name (e.g., `test` to `test.yaml`)
  - Remove `skip_terraform_by_renovate` and `renovate_terraform_labels`. Add `skip_terraform_files` if needed
  - Remove tfsec support
    - Migration to trivy is recommended
  - Migrate `conftest_policy_directory` to `conftest`
  - Remove automatic Conftest execution when a `policy` directory exists
    - Explicit configuration in tfaction-root.yaml is now required
  - Migrate target_groups `target` to `replace_target`
  - Change target_groups `working_directory` to glob patterns
    - Trailing `/` is no longer needed
    - Changed from prefix matching to exact matching
  - Remove `target` from `label_prefixes`
  - Change file paths in tfaction-root.yaml (`working_directory`, `template_dir`, `conftest.policy`) to **paths relative to the repository root where tfaction-root.yaml is located**
  - Change `follow_up_pr_group_label` to `follow_up_pr.group_label`
  - Change `renovate_login` to `auto_apps.logins`
  - Remove `update_related_pull_requests`
- Template changes
  - Update placeholders to use [Handlebars](https://handlebarsjs.com/)
- `renovate.json` changes
  - Remove the `renovate-change` label
- Remove target label feature
  - Removed because applying without codeowner review is a governance concern
- When a Renovate PR is not "No Change", disable auto-merge instead of failing CI

## Migrate `suzuki-shunsuke/tfaction/*` to `suzuki-shunsuke/tfaction` and add the `action` input

Before:

```yaml
uses: suzuki-shunsuke/tfaction/plan@latest
```

After:

```yaml
uses: suzuki-shunsuke/tfaction@latest
with:
  action: plan
```

The following actions are supported:

- apply
- create-drift-issues
- create-follow-up-pr
- create-scaffold-module-pr
- create-scaffold-pr
- export-aws-secrets-manager
- export-secrets
- generate-config-out
- get-global-config
- get-or-create-drift-issue
- get-target-config
- list-targets
- pick-out-drift-issues
- plan
- release-module
- scaffold-module
- scaffold-tfmigrate
- scaffold-working-dir
- set-drift-env
- setup
- sync-drift-issue-description
- terraform-init
- test
- test-module
- update-drift-issue

## Explicitly run `aws-actions/configure-aws-credentials` or `google-github-actions/auth` if AWS or Google Cloud authentication is required

In v1, the setup action ran `aws-actions/configure-aws-credentials` or `google-github-actions/auth` internally.
In v2, this is no longer done automatically.
Users need to run these actions themselves as needed.
The `setup` action outputs the IAM Role ARN and other values based on tfaction-root.yaml and tfaction.yaml configuration.

```yaml
- name: Set up
  uses: suzuki-shunsuke/tfaction@latest
  id: setup
  with:
    action: setup
    github_token: ${{steps.token.outputs.token}}
    securefix_action_app_id: ${{vars.SECUREFIX_ACTION_CLIENT_APP_ID}}
    securefix_action_app_private_key: ${{secrets.SECUREFIX_ACTION_CLIENT_APP_PRIVATE_KEY}}

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

## Remove the export-secrets and export-aws-secrets-manager environment variable export feature

## Migrate tfaction-go to `suzuki-shunsuke/tfaction/*`

If you are not using Drift Detection, you can ignore this.

Before:

```yaml
- run: tfaction create-drift-issues
```

After:

```yaml
- uses: suzuki-shunsuke/tfaction@latest
  with:
    action: create-drift-issues
```

## Add the `TFACTION_SKIP_TERRAFORM` environment variable to jobs

```yaml
jobs:
  plan:
    env:
      TFACTION_SKIP_TERRAFORM: "${{matrix.target.skip_terraform}}"
```

## Remove module testing jobs that use `test-module`

If your plan workflow has a job that uses the test-module action to test modules, remove that job.
It has been integrated into the job for testing root modules.

## Remove workflows that use scaffold-module or create-scaffold-module-pr

Remove workflows for creating modules.
They have been integrated into the workflow for creating root modules.

## Remove SSH Key configuration

The feature that configured SSH Keys via the `ssh_key` input of the setup action has been removed.
Configure SSH Keys yourself if needed.

## Add update-pr-branch action after apply action

```yaml
- name: Apply
  uses: suzuki-shunsuke/tfaction@latest
  with:
    action: apply
    github_token: ${{ steps.token.outputs.token }}

# Add this after apply
- name: Update related PR branches
  uses: suzuki-shunsuke/tfaction@latest
  if: always()
  with:
    action: update-pr-branch
    github_token: ${{ steps.token.outputs.token }}
```

## Change `plan_workflow_name` from workflow name to file name (e.g., `test` to `test.yaml`)

Before:

```yaml
plan_workflow_name: test
```

After:

```yaml
plan_workflow_name: test.yaml
```

## Remove `skip_terraform_by_renovate` and `renovate_terraform_labels`. Add `skip_terraform_files` if needed

Remove:

```yaml
skip_terraform_by_renovate: true
renovate_terraform_labels:
  - terraform
```

Add (optional):

```yaml
skip_terraform_files:
  - "**/*.md" # Skip terraform plan and apply for markdown changes
```

## Change target_groups `working_directory` to glob patterns

- Trailing `/` is no longer needed
- Changed from prefix matching to exact matching
- [minimatch](https://github.com/isaacs/minimatch) is used

Before:

```yaml
target_groups:
  - working_directory: foo/
```

After:

```yaml
target_groups:
  - working_directory: foo/**
```

## Change file paths in tfaction-root.yaml to paths relative to the repository root

File paths in tfaction-root.yaml (`working_directory`, `template_dir`, `conftest.policy`) are now **relative to the repository root where tfaction-root.yaml is located**.

Previously, paths were relative to `GITHUB_WORKSPACE`, meaning they depended on the checkout path. This is no longer the case.

## Remove tfsec support

Migration to trivy is recommended.
Remove tfsec configuration from tfaction-root.yaml:

```yaml
tfsec: # Remove this
  enabled: true
```

[tfsec](https://github.com/aquasecurity/tfsec) has officially recommended migrating to trivy.
Therefore, tfaction will no longer support it.

## Migrate `conftest_policy_directory` to `conftest`

Before:

```yaml
conftest_policy_directory: policy
```

After:

```yaml
conftest:
  policies:
    - policy: policy
      plan: true
```

## Remove automatic Conftest execution when a `policy` directory exists

In v1, Conftest was automatically executed when a `policy` directory existed. This has been removed.
To run Conftest, you need to explicitly configure it in tfaction-root.yaml:

```yaml
conftest:
  policies:
    - policy: policy
      plan: true
```

## Migrate target_groups `target` to `replace_target`

Before:

```yaml
target_groups:
  - working_directory: github/services/
    target: github/
```

After:

```yaml
replace_target:
  patterns:
    - regexp: /services/
      replace: /
```

Also, `replace` has been renamed to `replace_target`.

## Remove `target` from `label_prefixes`

```yaml
label_prefixes:
  target: "target:" # Remove this
```

## Change `follow_up_pr_group_label` to `follow_up_pr.group_label`

Before:

```yaml
follow_up_pr_group_label:
  enabled: true
  prefix: "tfaction:follow-up-pr-group/"
```

After:

```yaml
follow_up_pr:
  group_label:
    enabled: true
    prefix: "tfaction:follow-up-pr-group/"
```

## Change `renovate_login` to `auto_apps.logins`

Before:

```yaml
renovate_login: "renovate[bot]"
```

After:

```yaml
auto_apps:
  logins:
    - "renovate[bot]"
```

You can now specify multiple GitHub accounts.
By default, both `renovate[bot]` and `dependabot[bot]` are included.
If you want to exclude `dependabot[bot]` and only target `renovate[bot]` as before, explicitly specify only `renovate[bot]` as shown above.

## Remove `update_related_pull_requests`

```yaml
update_related_pull_requests: # Remove this
  enabled: false
```

PRs are no longer updated unless you run the update-pr-branch action in the apply workflow.

## Template changes

Update placeholders to use [Handlebars](https://handlebarsjs.com/):

- Change `%%...%%` to `{{...}}`
- Variable names use snake_case

Before:

```
%%MODULE_NAME%%
```

After:

```
{{module_name}}
```

## `renovate.json` changes

Remove the `renovate-change` label.

## Remove target label feature

The feature that ran CI for a specified target by adding a `target:<target>` label to a PR -- even without code changes -- has been removed.
While this feature was convenient and occasionally used, allowing `terraform apply` (i.e., infrastructure changes) without codeowner review was a governance concern.

## Disable auto-merge instead of failing CI when a Renovate PR is not "No Change"

In v1, CI failed when a Renovate PR's `terraform plan` result was not "No Change".
This was to prevent unexpected changes from being applied automatically when auto-merging Renovate PRs.
To prevent CI failure, you had to add the `renovate-change` label.
However, failing CI had several issues:

- Poor experience
  - To accept the changes, you had to add the `renovate-change` label and then rerun CI
  - It was difficult to distinguish between failures due to "not No Change" and other reasons (e.g., `terraform validate` failing)
- Risk
  - After adding the `renovate-change` label, CI would pass even if there were changes, so with auto-merge enabled, apply would run without anyone reviewing the plan results

In v2, auto-merge is disabled to prevent automatic merging.

![](https://storage.googleapis.com/zenn-user-upload/a9426176ff50-20260211.png)

Setting `accept_change_by_renovate: true` in tfaction.yaml prevents auto-merge from being disabled.
This is intended for root modules used to test whether workflows work correctly when PRs modify them.
