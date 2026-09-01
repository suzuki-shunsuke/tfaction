---
sidebar_position: 100
---

# What is tfaction

tfaction is a set of GitHub Actions for building workflows that run Terraform or OpenTofu on GitHub Actions.

It provides a basic GitHub Flow where `terraform plan` runs on pull requests, and `terraform apply` runs when the PR is merged.

## Features

- Provides simple workflows powered by GitHub Actions
  - No need to run `terraform apply` locally
- OSS (MIT LICENSE)
  - Free to use
  - No vendor lock-in to SaaS platforms
- Supports OpenTofu and Terragrunt
- Feature-rich
  - Native support for peripheral tools like tflint, trivy, and conftest in addition to Terraform
  - Thoughtful details such as automatic code fixes and automatic PR branch updates
  - Drift Detection support
- Flexibility
  - Since it uses GitHub Actions, you can add steps before or after tfaction's steps, or use only specific features -- workflows are highly customizable
- Reduced workflow operation and maintenance costs
  - No need to build workflows from scratch
  - Features are enabled simply by adding a few lines to declarative configuration files

Below is an overview of tfaction's key features.

## Monorepo Support

Natively supports monorepos that manage multiple Terraform root modules.
CI runs only for root modules changed in a PR.
There is also a feature that triggers CI for a root module when a dependent local-path module is updated.

## Clear PR Comments for `terraform plan` and `apply` Results

Using a tool called [tfcmt](https://github.com/suzuki-shunsuke/tfcmt), tfaction posts clear and easy-to-read summaries of `terraform plan` and `apply` results directly to pull requests.

![tfcmt](https://user-images.githubusercontent.com/13323303/136236949-bac1a28d-4db2-4a08-900a-708a0a02311c.png)

## Linting

Runs linting with tools such as `terraform validate`, `tflint`, `trivy`, and `conftest`.

`tflint` and `trivy` results are reported in a developer-friendly way using reviewdog.

![tflint](https://user-images.githubusercontent.com/13323303/153742908-2512f73a-1505-4c0c-9284-b6deb8983c2f.png)

`conftest` can be executed against both HCL files and plan files.

## Automatic Code Fixes

Runs `.terraform.lock.hcl` updates, `terraform fmt`, `terraform-docs`, `tflint --fix`, and other tools to automatically fix code and push commits to the PR.

![commit](https://user-images.githubusercontent.com/13323303/155866979-52dd2e6f-9885-4af1-bac0-abd1280fdea5.png)

![fmt](https://user-images.githubusercontent.com/13323303/155866989-8cbcd50e-4764-4f47-a50f-102d04a04f89.png)

Additionally, if a PR's feature branch is behind the base branch, it automatically updates the branch.
In practice, having issues fixed automatically provides a far better developer experience than simply failing CI.

## Safe `apply` Using Plan Files

The plan file generated during `terraform plan` in the PR is used during `terraform apply`, preventing discrepancies between the plan result and the actual apply.

## Auto-disable Renovate Auto-merge When `terraform plan` Shows Changes

Prevents unexpected changes from being applied when a Renovate PR is auto-merged.

![renovate](https://github.com/user-attachments/assets/5c14a9dc-fbb6-44a4-99b3-952dbfe9885d)

## Automatically Create Follow-up PRs When `terraform apply` Fails

When `terraform apply` fails, tfaction automatically creates a follow-up PR to help address the failure.

## Scaffold Working Directory Workflow

Provides a workflow for adding root modules based on user-defined templates.
It is executed via `workflow_dispatch`.
Compared to running scripts locally, this approach has fewer environment dependencies and makes investigation easier by reviewing the action logs when issues occur.

## Drift Detection

Periodically detects drift between code and the actual infrastructure state, and manages it via GitHub Issues.
The `plan` result is recorded as a comment in the issue, making it easy to identify when drift occurred.
Because it leverages GitHub Issues, everything is managed within GitHub.

## Support for OpenTofu and Terragrunt

Supports not only Terraform but also Terraform-compatible tools such as OpenTofu, as well as Terragrunt.

## tfmigrate

Runs [tfmigrate](https://github.com/minamijoyo/tfmigrate) on GitHub Actions to achieve state migration as IaC.
Although the need for tfmigrate has decreased since Terraform officially added support for `moved` blocks, `removed` blocks, and `import` blocks, it remains useful when you need to move resources between states.

## CSM (Client/Server Model) Actions (Securefix Action) Support

CSM Actions applies the Client/Server Model to GitHub Actions, enabling safer commit and PR creation.

https://github.com/csm-actions/docs

https://github.com/csm-actions/securefix-action

tfaction natively supports this.

## Import via `terraform plan -generate-config-out`

`terraform plan -generate-config-out` is a very useful command that generates resource blocks from import blocks.

https://developer.hashicorp.com/terraform/language/import

tfaction can run this in CI, commit the result, and auto-generate code.
This is especially convenient when running `terraform plan` locally is difficult due to permission constraints.

---

This concludes the overview of tfaction.
In the next chapter, we will implement a simple workflow using the minimum tfaction configuration.
