---
sidebar_position: 100
slug: /
---

# tfaction

[![Ask DeepWiki](https://img.shields.io/badge/Ask_DeepWiki-000000.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==)](https://deepwiki.com/suzuki-shunsuke/tfaction)
[NotebookLM](https://notebooklm.google.com/notebook/77adecc4-c88b-4b98-830f-fb79a448c451) | [Who uses tfaction?](https://github.com/suzuki-shunsuke/tfaction#who-uses-tfaction) | [Release Note](https://github.com/suzuki-shunsuke/tfaction/releases) | [MIT LICENSE](https://github.com/suzuki-shunsuke/tfaction/blob/main/LICENSE)

tfaction is a GitHub Actions to build sophisticated Terraform workflows for Monorepo easily.
You don't have to run `terraform apply` in your laptop, and don't have to reinvent the wheel for Terraform Workflows anymore.
tfaction provides various features such as auto-fix, auto-format, lint (tflint, trivy, conftest), drift detection, and so on.

## :bulb: NotebookLM and DeepWiki for tfaction

You can ask any questions about tfaction to the notebook and DeepWiki!

- [Notebook](https://notebooklm.google.com/notebook/77adecc4-c88b-4b98-830f-fb79a448c451): This notebook is built based on the document.
- [DeepWiki](https://deepwiki.com/suzuki-shunsuke/tfaction)

## Features

- Run `terraform plan` in pull requests, and run `terraform apply` by merging pull requests into the default branch
- [Dynamic build matrix for Monorepo](/tfaction/docs/feature/build-matrix)
  - CI is run on only changed working directories
- Notify the results of CI to pull requests using tfcmt, github-comment, and reviewdog
  - You don't have to check CI log
- [Run `terraform apply` safely using the plan file created by the merged pull request's `terraform plan`](/tfaction/docs/feature/plan-file)
- [Update related pull requests automatically when the remote state is updated](/tfaction/docs/feature/auto-update-related-prs)
  - Keep the result of CI including `terraform plan` up-to-date
- Update pull request branches when the working directory has changes in the base branch
- [Create a pull request automatically to follow up the apply failure](/tfaction/docs/feature/follow-up-pr)
- Support linters
  - terraform validate
  - [trivy](https://github.com/aquasecurity/trivy)
  - [tflint](https://github.com/terraform-linters/tflint)
  - [conftest](https://www.conftest.dev/)
- [Support tfmigrate](/tfaction/docs/feature/tfmigrate)
- [Update dependencies by Renovate safely](/tfaction/docs/feature/renovate)
  - Prevent Renovate from applying unexpected changes, and enables to merge pull requests without changes safely
- [Workflows for Terraform Modules](/tfaction/docs/feature/module)
  - Scaffold, Test, Release Modules
- Workflows for scaffolding
  - Scaffold a working directory, Terraform Module, pull request for tfmigrate
- [Update .terraform.lock.hcl automatically](/tfaction/docs/feature/auto-fix)
  - A commit is pushed automatically, so you don't have to update .terraform.lock.hcl manually
- [Format Terraform Configuration automatically](/tfaction/docs/feature/auto-fix)
  - A commit is pushed automatically, so you don't have to format Terraform configuration manually
- [Drift Detection](/tfaction/docs/feature/drift-detection)
  - Detect the drift periodically and manage the drift as GitHub Issues
- [Support Terraform compatible tools such as OpenTofu and Terragrunt](/tfaction/docs/feature/use-terraform-compatible-tool)
- [Support running CI on working directories that depend on a updated local path Module](/tfaction/docs/feature/local-path-module)
- [Generate code by `terraform plan -generate-config-out` to import resources](/tfaction/docs/feature/generate-config-out)
- [Generate document by terraform-docs](/tfaction/docs/feature/terraform-docs)
- [Securefix Action](feature/securefix-action.md)

[Dynamic build matrix for Monorepo](feature/build-matrix.md)

![image](https://user-images.githubusercontent.com/13323303/151699474-b6cf9927-a0d1-4eb7-85fd-19504432362c.png)

Notify the result of CI to pull requests with [tfcmt](https://github.com/suzuki-shunsuke/tfcmt), [github-comment](https://github.com/suzuki-shunsuke/github-comment), and [reviewdog](https://github.com/reviewdog/reviewdog)

Result of `terraform plan`

![image](https://user-images.githubusercontent.com/13323303/147400233-8b9411d6-0255-4c36-9e9f-35e44223c979.png)

Result of `trivy`

![image](https://github.com/suzuki-shunsuke/trivy-config-action/assets/13323303/e4d7f6f7-3df3-44bb-8f98-535173ce096e)

Result of `tflint`

![image](https://user-images.githubusercontent.com/13323303/153742833-403ea6c5-a780-4d2a-a30c-3a481c0971b1.png)

Result of `conftest`

![image](https://user-images.githubusercontent.com/13323303/150035710-249c4cbd-47fa-46d7-ae0d-28ab4ace1a64.png)

[Update related pull requests automatically when the remote state is updated](/tfaction/docs/feature/auto-update-related-prs)

![image](https://user-images.githubusercontent.com/13323303/151699327-ba31892c-c4a6-47e7-a944-15fca81dfbfb.png)

[Create a pull request automatically to follow up the apply failure](/tfaction/docs/feature/follow-up-pr)

![image](https://user-images.githubusercontent.com/13323303/151699230-1c109a57-47d1-4c3b-9c3a-4dfec786a043.png)

![image](https://user-images.githubusercontent.com/13323303/151699142-6d19cd51-eac5-4f69-bfe5-7920df69edc6.png)

[Support tfmigrate](/tfaction/docs/feature/tfmigrate)

`tfmigrate plan`

![image](https://user-images.githubusercontent.com/13323303/150029520-fd3aac78-d76a-41ee-9df0-a7fc02fb12b7.png)

`tfmigrate apply`

![image](https://user-images.githubusercontent.com/13323303/150029697-316218e0-cb1e-4a8d-ad5c-0c12e1cb68dc.png)

[Update dependencies by Renovate safely](/tfaction/docs/feature/renovate)

CI fails if there are changes, which enables you to merge pull requests without unexpected changes safely.

![image](https://user-images.githubusercontent.com/13323303/150064670-2c6a646f-81f2-496f-b69a-873b6469593e.png)

[Update .terraform.lock.hcl automatically](/tfaction/docs/feature/auto-fix)

![image](https://user-images.githubusercontent.com/13323303/155866735-85f964d8-7bb7-411c-9b20-5f7abcea3e1a.png)

--

![image](https://user-images.githubusercontent.com/13323303/155866753-32012a3b-02fe-4f58-935e-178283ae2c77.png)

[Format Terraform Configuration](/tfaction/docs/feature/auto-fix)

![image](https://user-images.githubusercontent.com/13323303/155866979-52dd2e6f-9885-4af1-bac0-abd1280fdea5.png)

--

![image](https://user-images.githubusercontent.com/13323303/155866989-8cbcd50e-4764-4f47-a50f-102d04a04f89.png)

[Drift Detection](/tfaction/docs/feature/drift-detection)

![image](https://user-images.githubusercontent.com/13323303/233079963-68765f2e-1efd-4278-b6c3-145eae9ef9c0.png)

## Available versions

The main branch and feature branches don't work.
[Please see the document](https://github.com/suzuki-shunsuke/release-js-action/blob/main/docs/available_versions.md).

## Who uses tfaction?

Please see [here](https://github.com/suzuki-shunsuke/tfaction#who-uses-tfaction).

## Release Notes

https://github.com/suzuki-shunsuke/tfaction/releases
