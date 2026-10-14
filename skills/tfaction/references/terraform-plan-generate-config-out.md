---
sidebar_position: 2500
---

# Code Generation with terraform plan -generate-config-out

`terraform plan -generate-config-out` is a very useful command that generates resource blocks from import blocks.

https://developer.hashicorp.com/terraform/language/import

With tfaction, you can run this in CI, commit the results, and automatically generate code.
This is especially useful when developers do not have the permissions to run terraform plan locally.

## Creating a Workflow

This workflow runs `terraform plan -generate-config-out` on a specified branch and directory to generate code and commit it.
This workflow does not create a PR.
You need to add import blocks to the target branch beforehand.
After running the workflow, create a PR.

```yaml
name: Import resources
run-name: Import resources (${{inputs.working_dir}})
on:
  workflow_dispatch:
    inputs:
      working_dir:
        description: working directory
        required: true
      file:
        description: file name
        required: true
      branch:
        description: branch name
        required: true
env:
  TFACTION_WORKING_DIR: ${{github.event.inputs.working_dir}}
  TFACTION_JOB_TYPE: terraform
  FILE: ${{inputs.file}}
  BRANCH: ${{inputs.branch}}
jobs:
  import:
    timeout-minutes: 10
    runs-on: ubuntu-26.04
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          ref: ${{inputs.branch}}

      - name: Create GitHub App installation access token
        uses: actions/create-github-app-token@64ab729a6294000f5aa4a4bc0b73d1f32bc45510 # v3.3.0
        id: token
        with:
          app-id: ${{ vars.APP_ID }}
          private-key: ${{ secrets.PRIVATE_KEY }}
          permission-contents: write

      - uses: suzuki-shunsuke/tfaction@latest
        id: setup
        with:
          action: setup
          github_token: ${{steps.token.outputs.token}}

      - uses: suzuki-shunsuke/tfaction@latest
        with:
          action: terraform-init
          github_token: ${{steps.token.outputs.token}}

      - uses: suzuki-shunsuke/tfaction@latest
        with:
          action: generate-config-out
          github_token: ${{steps.token.outputs.token}}
          branch: ${{inputs.branch}}
          file: ${{inputs.file}}
```
