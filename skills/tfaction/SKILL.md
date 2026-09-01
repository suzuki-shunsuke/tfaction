---
name: tfaction
description: |
  Use this skill when working with tfaction, a GitHub Action for running Terraform or OpenTofu on GitHub Actions.
  Use this skill when the user wants to:
  - Build or change GitHub Actions workflows that run terraform plan on pull requests and terraform apply on merge with tfaction
  - Edit `tfaction.yaml` or `tfaction-root.yaml`, or work out where a given setting belongs and what overrides what
  - Configure a tfaction feature (drift detection, plan files, follow-up PRs, scaffolding, tfmigrate, secrets, AWS/Google Cloud authentication, linting, target aliases)
  - Troubleshoot a tfaction workflow run — a failed apply, a stale plan file, a missing root module in the target list, a label that fails to be created
  - Upgrade tfaction from v1 to v2
  Even if the user doesn't mention "tfaction" by name — if they are editing `tfaction.yaml` / `tfaction-root.yaml`, or asking about a workflow that calls `suzuki-shunsuke/tfaction`, this skill applies.
---

tfaction is a set of GitHub Actions for running Terraform or OpenTofu on GitHub Actions.
It provides a GitHub Flow where `terraform plan` runs on pull requests and `terraform apply`
runs when the pull request is merged. Since v2 it is a single JavaScript Action whose feature
is selected through the `action` input. It is configured by a repository-wide
`tfaction-root.yaml` and a per-root-module `tfaction.yaml`.

Don't read every reference file. Read only the one that matches the task.

## Gotchas

- tfaction v2 is a single action. Every feature is selected via the `action` input on `suzuki-shunsuke/tfaction`, so v1 code that calls separate actions such as `suzuki-shunsuke/tfaction/setup` does not work. See [Actions](references/actions.md) for the valid `action` values.
- A setting can appear in five places, and the effective value is not "the most specific file wins" alone. From highest to lowest: `tfaction.yaml` per-job-type block, `tfaction.yaml` top level, `tfaction-root.yaml` `target_groups[]` per-job-type block, `tfaction-root.yaml` `target_groups[]`, `tfaction-root.yaml` top level. Check [Configuration Priority](references/config-priority.md) before concluding a setting is being ignored.
- `terraform apply` consumes the plan file produced during `terraform plan`. Once an apply fails, that plan file is stale and rerunning the failed workflow run fails again — a new pull request is needed. This is what follow-up PRs automate.
- `list-targets` lists only the root modules that were directly changed. A root module that references a module through a relative path outside its own directory is not listed when only that module changes, unless module dependency detection is configured.
- Approvals are dismissed right after `terraform plan` by default, so reviewers must approve after seeing the plan. This is on unless it is explicitly disabled.
- Drift detection is off by default and is enabled per root module.
- Storing plan files in S3 is AWS-only and applies only to the `terraform` job type; `tfmigrate` does not use a plan-file artifact.
- GitHub pull request labels are limited to 50 characters. A long path from the repository root to a root module can exceed that and make label creation fail; target aliases exist to shorten it.

## Getting started

- [What is tfaction](references/overview.md) — to understand what tfaction does and whether it fits a use case.
- [Getting Started](references/getting-started.md) — to build a first working workflow with the minimum configuration: `tfaction.yaml`, `tfaction-root.yaml`, installing Terraform, and creating a GitHub App.
- [tfaction v2 is a Single Action](references/single-action.md) — to understand why the workflow calls the same action repeatedly with different `action` inputs.
- [Monorepo](references/monorepo.md) — to manage more than one root module in a repository.
- [Workflows](references/workflows.md) — to see which workflow files exist, what each one does, and which ones a given setup actually needs.
- [Actions](references/actions.md) — to look up a specific `action` input value, its inputs, outputs, and the environment variables shared across actions.

## Configuration

- [Configuration Priority](references/config-priority.md) — to work out which of several definitions of a setting wins.
- [JSON Schema for Configuration Files](references/json-schema.md) — to get editor validation and completion for `tfaction.yaml` and `tfaction-root.yaml`.
- [AWS Configuration](references/aws.md) — to use the AWS provider or the S3 backend, and to set up the IAM role to assume.
- [Configuration for Google Cloud](references/google-cloud.md) — to use the Google Cloud provider or the GCS backend, and to set up Workload Identity.
- [Handling Secrets](references/secret.md) — to pass secrets to `terraform init`, `plan`, and `apply` from GitHub Secrets or AWS Secrets Manager without exposing them to later workflow steps.
- [Configuring Target (Aliases)](references/target.md) — to shorten the root module paths that appear in pull request comments and labels, especially when a label hits the 50-character limit.
- [Configuring Terraform Command Options](references/terraform-options.md) — to pass extra options to terraform commands via `TF_CLI_ARGS` and `TF_CLI_ARGS_name`.
- [Configuring tfcmt](references/tfcmt-config.md) — to change the pull request comments tfcmt posts, including disabling its labels.
- [Using OpenTofu or Terragrunt](references/opentofu-terragrunt.md) — to replace the `terraform` command with a compatible tool.

## Features

- [Linting and Formatting](references/lint.md) — to configure what the `test` action runs: `terraform fmt`, `terraform validate`, tflint, and other linters.
- [Safe Apply Using Plan Files](references/plan-file.md) — to understand how the plan produced on a pull request is carried over to apply, and why a failed apply cannot simply be rerun.
- [Store Plan Files in S3](references/plan-file-s3.md) — to store plan files in S3 instead of GitHub Artifacts (AWS and the `terraform` job type only).
- [Follow-up PR](references/follow-up-pr.md) — to recover from a failed `terraform apply` by having tfaction create the follow-up pull request.
- [Automatic PR Branch Updates](references/update-pr-branch.md) — to re-run plan on pull requests touching a root module after it is applied, and to keep pull request branches up to date with the base branch.
- [Drift Detection](references/drift-detection.md) — to detect divergence between code and real infrastructure and track it as a GitHub Issue per root module. Off by default, enabled per root module.
- [Module](references/module.md) — to manage a module (not a root module) with tfaction by setting `type: module` in its `tfaction.yaml`.
- [Trigger Terraform When Dependent Local-path Modules Are Updated](references/detect-module-dependency.md) — when a root module is not planned after a local-path module it depends on was changed.
- [Scaffolding Root Modules and Modules from Templates](references/scaffold-working-directory.md) — to add a workflow that creates new root modules or modules from templates.
- [tfmigrate](references/tfmigrate.md) — to run state migrations as code, such as moving resources between states.
- [Destroying All Resources in a Root Module](references/destroy.md) — to run plan and apply with `-destroy` by setting `destroy: true`.
- [Code Generation with terraform plan -generate-config-out](references/terraform-plan-generate-config-out.md) — to generate resource blocks from import blocks in CI and commit the result.
- [Auto Apps (Renovate, Dependabot)](references/auto-app.md) — to configure how tfaction treats pull requests opened by apps and machine users.
- [Secure Commits and PR Creation with CSM Actions](references/csm-actions.md) — to create commits and pull requests without granting `contents: write` to the workflow's `github_token`.

## Tuning behavior

- [Hiding Or Delete Old PR Comments](references/hide-or-delete-old-comment.md) — when old tfcmt comments pile up on a pull request.
- [Dismiss approval before plan](references/dismiss-approval-before-plan.md) — to turn off the default dismissal of approvals after plan.
- [Disable PR creation](references/skip-create-pr.md) — to have tfaction push a commit and branch, and print a GitHub CLI command, instead of opening a pull request itself.
- [Notify bot PR events](references/notify-bot-pr-event.md) — to get notified when a bot-authored pull request is reviewed, merged, or closed.
- [Limiting the Number of Root Modules Changed in a Single PR](references/limit-max-changed-dirs.md) — to cap how many root modules one pull request may touch. No limit by default.
- [Skipping terraform plan and apply](references/skip-terraform.md) — to skip plan and apply when only files that cannot affect the result were changed. Off by default.
- [Testing Workflow Changes](references/test-workflow.md) — to run plan, or plan and apply, on chosen directories when a workflow changed but no root module did.

## Upgrading to v2

- [v2 Upgrade Guide](references/v2-upgrade-guide.md) — to migrate from v1. Every v1 user has to make changes.
- [v2 Release Note](references/v2-release-note.md) — to see what changed in v2 and why.
