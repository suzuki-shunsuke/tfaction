---
sidebar_position: 3200
---

# Actions

tfaction is a single action, but it provides various features through the `action` input.
This page describes the features available for each `action` input value.

List of actions: [src/actions](https://github.com/suzuki-shunsuke/tfaction/tree/main/src/actions)

## Common Inputs and Environment Variables

Some inputs and environment variables are shared across multiple actions.

Inputs:

- github_token: GitHub Access Token used to post comments on PRs, etc.
- github_token_for_github_provider: GitHub Access Token used for the GitHub Provider. Not required if you do not use the GitHub Provider.
- secrets: JSON containing environment variable names and values set during commands such as terraform init, plan, and apply. Used to pass secrets required for command execution.

Environment variables:

- TFACTION_JOB_TYPE: One of `terraform` | `tfmigrate` | `scaffold_working_dir`. Controls the behavior of the action.
  - `terraform`: Runs terraform plan or apply
  - `tfmigrate`: Runs tfmigrate plan or apply
- TFACTION_SKIP_TERRAFORM
- TFACTION_IS_APPLY: `true` | `false`. Set to `true` in apply workflows and `false` in plan workflows.
  - Required to switch between plan-specific and apply-specific configuration.
  ```yaml title="tfaction.yaml"
  terraform_plan_config:
    # plan configuration
    aws_assume_role_arn: arn:aws:iam::123456789012:role/GitHubActions_Terraform_github_terraform_plan
  terraform_apply_config:
    # apply configuration
    aws_assume_role_arn: arn:aws:iam::123456789012:role/GitHubActions_Terraform_github_terraform_apply
  ```

## apply

Runs terraform apply or tfmigrate apply.

All inputs are optional.

- github_token
- github_token_for_github_provider
- secrets

Environment variables:

- TFACTION_JOB_TYPE
- TFACTION_SKIP_TERRAFORM

1. If skip_terraform is enabled, does nothing
1. Downloads the plan file from GitHub Artifacts
   1. Fails if plan_workflow_name is incorrect
1. Runs terraform apply and notifies via tfcmt
1. If drift detection is enabled, updates the drift issue

## create-drift-issues

Creates or closes drift detection issues to keep them in sync with the list of root modules.

1. If drift detection is disabled, does nothing
1. Retrieves the list of root modules
   1. Excludes root modules where drift detection is disabled
1. Retrieves the list of GitHub Issues via the GitHub API
1. Synchronizes root modules and issues
   1. Creates an issue if one does not exist for a root module
   1. Renames and closes the issue if the root module no longer exists

## create-follow-up-pr

Creates a PR that updates the same root module when apply fails, helping resolve the failure.
If `skip_create_pr` is enabled, only creates a commit and branch without creating a PR.

1. If group label is enabled, creates and assigns the group label to the PR
1. Creates or updates `.tfaction/failed-prs`
1. If TFACTION_JOB_TYPE is tfmigrate, assigns the tfmigrate label to the new PR
   1. This ensures tfmigrate runs on the new PR
1. Creates the follow-up PR
1. Comments the follow-up PR URL on the original PR
   1. When using Securefix Action to create a PR, the PR is created asynchronously so the URL is unknown and cannot be commented

## create-scaffold-pr

Creates a PR to add a module or root module. Runs after `scaffold-working-dir`.
If `skip_create_pr` is enabled, only creates a commit and branch without creating a PR.

1. Retrieves the list of files to commit via git ls-files
1. Creates the PR

## export-aws-secrets-manager

## generate-config-out

Runs `terraform plan --generate-config-out` to generate code and commits it.

## get-or-create-drift-issue

Creates a drift issue for a specific root module if one does not exist.
Exports the environment variables TFACTION_DRIFT_ISSUE_NUMBER and TFACTION_DRIFT_ISSUE_STATE.
Does nothing if drift detection is disabled.

## get-target-config

## hide-comment

Hides old comments.
tfaction embeds metadata as HTML comments in its PR comments and uses this metadata to determine whether each comment should be hidden.

```md title="Metadata format"
<!-- github-comment: { JSON } -->
```

Inputs:

- if: Condition for hiding comments. Written in CELL.

## list-targets

Generates a list of root modules changed in a PR.
Used to run CI only on the changed root modules in a monorepo.

No configuration is required beyond the action input.

The outputs are intended to be used as env, runs-on, and environment in subsequent matrix jobs.

- targets: JSON list of changed root modules and modules

```json title="targets"
[
  {
    "target": "github/foo",
    "working_directory": "github/service/foo",
    "runs_on": "ubuntu-latest",
    "job_type": "terraform",
    "environment": "production",
    "type": "module"
  }
]
```

- target: Alias for working_directory. By default, same as `working_directory`
- runs_on: Job execution environment. Defaults to `ubuntu-latest`
- environment: GitHub Environments
- type: Working directory type. Set to `module` for modules

```yaml title=".github/workflows/test.yaml"
plan:
  name: "plan (${{matrix.target.target}})" # Different job name per root module
  timeout-minutes: 60
  runs-on: ${{matrix.target.runs_on}}
  environment: ${{matrix.target.environment}}
  needs: [list]
  env:
    TFACTION_TARGET: ${{matrix.target.target}}
    TFACTION_WORKING_DIR: ${{matrix.target.working_directory}}
    TFACTION_JOB_TYPE: ${{matrix.target.job_type}}
  if: "join(fromJSON(needs.list.outputs.targets), '') != ''"
  strategy:
    fail-fast: false
    matrix:
      target: ${{fromJSON(needs.list.outputs.targets)}}
```

You can customize the settings in tfaction-root.yaml.

```yaml title="tfaction-root.yaml"
replace_target:
  patterns:
    - regexp: /services/
      replace: /
target_groups:
  - working_directory: github/services/**
    runs_on: ubuntu-slim
    environment: production
```

## pick-out-drift-issues

Retrieves the list of root modules and their issues for periodic drift detection checks.
After this action retrieves the list, subsequent matrix jobs perform the checks.
When there are many root modules, checking all of them at once is impractical, so it checks the N root modules whose last check time is the oldest.
Since check results are recorded in the issue each time, the last check time is tracked by the drift issue's updated date.
Additionally, only root modules whose last check time is more than N days ago are included.

Outputs:

- has_issues: true or false. false if no issues were picked out
- issues: List of picked-out issues

```json title="issues"
[
  {
    "number": 12345,
    "title": "Issue Title",
    "target": "Root module target",
    "state": "closed (issue state)",
    "runs_on": "runs-on for the subsequent drift detection job"
  }
]
```

Returns empty if drift detection is disabled.

has_issues: `false`
issues: `[]`

1. Retrieves issues via the GitHub API whose title contains `Terraform Drift` and whose update date is older than the threshold
   1. Extracts the root module target from the title

## plan

Runs terraform plan or tfmigrate plan and comments the results on the PR via tfcmt.
Uploads the plan file in both binary and JSON formats to GitHub Artifacts.
If configured, runs Conftest against the plan file.
If the plan result is not "No Change" on a Renovate PR and the setting is enabled, disables auto-merge.

## release-module

Creates a GitHub Tag and Release for a specified module.
Modules are expected to be referenced as GitHub Repository Sources.
To manage versions of multiple modules in a monorepo, the version includes the module path with `/` replaced by `_`.

Inputs:

- module_path: Directory path where the module resides. Relative path from the Git root directory.
- version: Module version. A SemVer-compliant string. The actual tag includes the module path with `/` replaced by `_`.

Generated tag: `module_{module_path with / replaced by _}_{version}`

## scaffold-tfmigrate

Creates a PR that adds tfmigrate configuration files and migration file scaffolds for a specified root module.
If an existing PR is specified, pushes a commit to that PR instead of creating a new one.

## scaffold-working-dir

Creates a new root module from a template.
This action only generates the code.
Run `create-scaffold-pr` after this action to create the PR.

Environment variables:

- TFACTION_TARGET
- TFACTION_WORKING_DIR

If `s3_bucket_name_tfmigrate_history` or `gcs_bucket_name_tfmigrate_history` is configured, generates a `.tfmigrate.hcl` file.
Template files are processed with Handlebars.

## set-drift-env

Exports environment variables for drift detection.

## setup

The action to run at the beginning of plan and apply jobs.

Exported environment variables:

- AQUA_GLOBAL_CONFIG
- TFACTION_WORKING_DIR
- TFACTION_TARGET
- Environment variables configured in tfaction-root.yaml and tfaction.yaml

Outputs:

- working_directory
- providers_lock_opts
- enable_tflint
- enable_trivy
- tflint_fix
- terraform_command
- template_dir
- aws_region
- aws_assume_role_arn
- aws_role_session_name
- gcp_service_account
- gcp_workload_identity_provider
- gcp_access_token_scopes
- gcp_remote_backend_service_account
- gcp_remote_backend_workload_identity_provider
- s3_bucket_name_tfmigrate_history
- gcs_bucket_name_tfmigrate_history
- destroy
- enable_terraform_docs
- accept_change_by_renovate

1. Runs ci-info to retrieve PR information. Exports as environment variables and writes to temporary files
1. Fails if the SHA running the workflow is not the latest head SHA of the PR
1. Updates the branch if the PR branch is outdated
1. Assigns root module labels to the PR
1. Exports settings as environment variables and outputs
1. Aggregates secrets into JSON and outputs them
1. If configured, updates aqua-checksums.json

## sync-drift-issue-description

When a comment is posted on a drift detection issue, reflects the comment content in the issue description.
Intended to run on the issue_comment event.
This ensures that the latest results are always visible in the issue description.

## terraform-init

Runs terraform init.
Automatically generates and updates .terraform.lock.hcl.

## test

Runs linting, formatting, and documentation generation tools such as terraform validate, terraform fmt, terraform-docs, tflint, and trivy.

## update-drift-issue

Updates a specified drift issue based on plan or apply results.
Closes the issue on success; reopens it on failure.
This is a separate action so it can always run in apply jobs and drift detection jobs.

## update-pr-branch

Updates the branch of PRs that modify the same root module after apply runs.
