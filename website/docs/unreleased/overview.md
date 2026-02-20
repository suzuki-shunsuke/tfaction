---
sidebar_position: 100
---

# tfaction

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/suzuki-shunsuke/tfaction)
[NotebookLM](https://notebooklm.google.com/notebook/77adecc4-c88b-4b98-830f-fb79a448c451) | [Who uses tfaction?](https://github.com/suzuki-shunsuke/tfaction#who-uses-tfaction) | [Release Note](https://github.com/suzuki-shunsuke/tfaction/releases) | [MIT LICENSE](https://github.com/suzuki-shunsuke/tfaction/blob/main/LICENSE)

tfaction is a GitHub Actions to build sophisticated Terraform (OpenTofu) workflows for Monorepo easily.
You don't have to run `terraform apply` in your laptop, and don't have to reinvent the wheel for Terraform Workflows anymore.
tfaction provides various features such as auto-fix (terraform fmt, .terraform.lock.hcl, terraform-docs, tflint --fix, and more), lint (tflint, trivy, conftest), drift detection, and more.

## :bulb: NotebookLM and DeepWiki for tfaction

You can ask any questions about tfaction to the notebook and DeepWiki!

- [Notebook](https://notebooklm.google.com/notebook/77adecc4-c88b-4b98-830f-fb79a448c451): This notebook is built based on the document.
- [DeepWiki](https://deepwiki.com/suzuki-shunsuke/tfaction)

## Features

- Running Terraform through GitHub Actions. No need to run `terraform apply` in your laptop or dedicated servers.
- OSS (MIT LICENSE)
- High Functionality - auto-fix, lint, drift detection, tfmigrate, and more
- Significantly reduce the implementation, operational, and maintenance costs of workflows.

### Support for OpenTofu and Terragrunt

Supports not only Terraform but also Terraform-compatible tools such as OpenTofu, as well as Terragrunt.

### Monorepo Support

Native support for monorepos managing multiple Terraform root modules.
CI runs only for the root modules changed in a PR.

It also supports triggering CI for root modules when their dependent local-path modules are updated.

### Clear PR Comments for `terraform plan` and `apply` Results

Using a tool called [tfcmt](https://github.com/suzuki-shunsuke/tfcmt), tfaction posts clear and easy-to-read summaries of `terraform plan` and `apply` results directly to pull requests.

![tfcmt](https://user-images.githubusercontent.com/13323303/136236949-bac1a28d-4db2-4a08-900a-708a0a02311c.png)

### Linting

Runs linting with tools such as:

- `terraform validate`
- `tflint`
- `trivy`
- `conftest`

`tflint` and `trivy` results are reported in a developer-friendly way using reviewdog.

![tflint](https://user-images.githubusercontent.com/13323303/153742908-2512f73a-1505-4c0c-9284-b6deb8983c2f.png)

`conftest` can be executed against any files including both HCL files and plan files.

### Automatic Code Fixes

Automatically runs tools such as:

- `.terraform.lock.hcl` updates
- `terraform fmt`
- `terraform-docs`
- `tflint --fix`

Then commits and pushes the fixes to the PR.

![commit](https://user-images.githubusercontent.com/13323303/155866979-52dd2e6f-9885-4af1-bac0-abd1280fdea5.png)
![fmt](https://user-images.githubusercontent.com/13323303/155866989-8cbcd50e-4764-4f47-a50f-102d04a04f89.png)

Additionally, if a PR’s feature branch is behind the base branch, it automatically updates the branch.
In practice, having issues fixed automatically provides a far better developer experience than simply failing CI.

### Safe `apply` Using Plan Files

To prevent discrepancies between `plan` and `apply`, tfaction uses the plan file generated during the PR’s `terraform plan` when running `terraform apply`.

### Automatically Create Follow-up PRs When `terraform apply` Fails

If `terraform apply` fails, tfaction automatically creates a follow-up PR to help address the failure.

![image](https://user-images.githubusercontent.com/13323303/151699230-1c109a57-47d1-4c3b-9c3a-4dfec786a043.png)

![image](https://user-images.githubusercontent.com/13323303/151699142-6d19cd51-eac5-4f69-bfe5-7920df69edc6.png)

### Drift Detection

Periodically detects drift between code and the actual infrastructure state, and manages it via GitHub Issues.

The `plan` result is recorded as a comment in the issue, making it easy to identify when drift occurred.
Because it leverages GitHub Issues, everything is managed within GitHub.

[Drift Detection](/tfaction/docs/feature/drift-detection)

![image](https://user-images.githubusercontent.com/13323303/233079963-68765f2e-1efd-4278-b6c3-145eae9ef9c0.png)

### And More

tfaction has more features. We can't introduce all of them in one page.

## Available versions

The main branch and feature branches don't work.
[Please see the document](https://github.com/suzuki-shunsuke/release-js-action/blob/main/docs/available_versions.md).

## Who uses tfaction?

Please see [here](https://github.com/suzuki-shunsuke/tfaction#who-uses-tfaction).
