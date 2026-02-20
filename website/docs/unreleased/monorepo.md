---
sidebar_position: 700
---

# Monorepo

In Getting Started, there was only one root module, but now let's set up a monorepo.

```
foo/
  tfaction.yaml
  main.tf
  # ...
bar/
  tfaction.yaml
  main.tf
  # ...
```

In a monorepo, you likely want to run terraform plan and apply only for the root modules changed in a PR.
You can easily achieve this using GitHub Actions matrix builds and tfaction's list-targets action.
list-targets outputs a list of root modules changed in the PR.
Since list-targets depends on git, you need to checkout the repository before running it.
However, a shallow clone is sufficient.

1. Add a `list` job

Run `list-targets` to get the list of target root modules and output it.

```yaml:.github/workflows/test.yaml
jobs:
  list:
    timeout-minutes: 10
    runs-on: ubuntu-24.04
    permissions:
      contents: read
    outputs:
      targets: ${{steps.list-targets.outputs.targets}}
    steps:
      - name: Checkout Repository
        uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1
        with:
          persist-credentials: false

      - name: List Targets
        uses: suzuki-shunsuke/tfaction@latest
        id: list-targets
        with:
          action: list-targets
```

2. Run plan with matrix builds after the list job

```yaml:.github/workflows/test.yaml
  plan:
    name: "plan (${{matrix.target.target}})" # Use a different job name for each root module
    timeout-minutes: 60
    runs-on: ubuntu-24.04
    needs: [list] # Run after list
    permissions:
      contents: read
    env:
      # Set environment variables for each root module
      TFACTION_TARGET: "${{matrix.target.target}}"
      TFACTION_WORKING_DIR: ${{matrix.target.working_directory}}
      TFACTION_JOB_TYPE: ${{matrix.target.job_type}}
    if: "join(fromJSON(needs.list.outputs.targets), '') != ''" # Skip if no root modules were changed
    strategy:
      fail-fast: false # Continue running other root modules even if one fails
      matrix:
        target: ${{fromJSON(needs.list.outputs.targets)}}
```

This way, CI runs only for the root modules changed in the PR using matrix builds.

![](https://storage.googleapis.com/zenn-user-upload/738ba40e1d0b-20260208.png)

PR comments and labels also include the root module path, making it easy to distinguish which root module they relate to.

![](https://storage.googleapis.com/zenn-user-upload/84d4951d11b1-20260208.png)

![](https://storage.googleapis.com/zenn-user-upload/e2c3f6bc17ba-20260208.png)
