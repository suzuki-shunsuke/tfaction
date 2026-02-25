---
sidebar_position: 700
---

# Monorepo

In [Getting Started](./getting-started), there was only one root module. Now let's set up a monorepo.

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

In a monorepo, you typically want to run `terraform plan` and `apply` only for the root modules changed in a PR.
This is easily achieved using GitHub Actions matrix builds and tfaction's `list-targets` action.

`list-targets` outputs a list of root modules changed in the PR.
It depends on git, so the repository must be checked out before running it.
A shallow clone is sufficient.

1. Add a `list` job

Run `list-targets` to get the list of target root modules and output it.

```yaml
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

1. Run plan using matrix builds after the `list` job

```yaml
plan:
  name: "plan (${{matrix.target.target}})" # Different job name per root module
  timeout-minutes: 30
  runs-on: ubuntu-24.04
  needs: [list] # Run after list
  permissions:
    contents: read
  env:
    # Set environment variables per root module
    TFACTION_TARGET: "${{matrix.target.target}}"
    TFACTION_WORKING_DIR: ${{matrix.target.working_directory}}
    TFACTION_JOB_TYPE: ${{matrix.target.job_type}}
  if: "join(fromJSON(needs.list.outputs.targets), '') != ''" # Skip if no root modules changed
  strategy:
    fail-fast: false # Continue other root modules even if one fails
    matrix:
      target: ${{fromJSON(needs.list.outputs.targets)}}
```

This runs CI via matrix builds only for the root modules changed in the PR.

![](https://storage.googleapis.com/zenn-user-upload/738ba40e1d0b-20260208.png)

PR comments and labels include the root module path, making it easy to identify which root module each comment or label belongs to.

![](https://storage.googleapis.com/zenn-user-upload/84d4951d11b1-20260208.png)

![](https://storage.googleapis.com/zenn-user-upload/e2c3f6bc17ba-20260208.png)
