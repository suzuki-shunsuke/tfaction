---
sidebar_position: 1130
---

# terraform plan -generate-config-out

[#1860](https://github.com/suzuki-shunsuke/tfaction/issues/1860) [#1870](https://github.com/suzuki-shunsuke/tfaction/pulls/1870) [v1.7.0](https://github.com/suzuki-shunsuke/tfaction/releases/tag/v1.7.0)

`import block` and `terraform plan -generate-config-out` are very useful to import resources.

https://developer.hashicorp.com/terraform/language/import

But some users can't run `terraform plan` on their laptop, so they can't run it.

tfaction provides an action generating Terraform code by `terraform plan -generate-config-out`.

## How to use

Please see [the example workflow](https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/generate-config-out.yaml).

1. Write import blocks and create a feature branch

:::info
We considered creating import blocks and pull requests by workflow, but unfortunately it was difficult because input types of workflow_dispatch event don't support multiline text.

https://github.com/orgs/community/discussions/12882

So we gave up it and decided to have users add import blocks and create a feature branch themselves.
:::

2. Run the workflow by workflow_dispatch event

The workflow generate code by `terraform plan -generate-config-out` and pushes a commit to the feature branch.
