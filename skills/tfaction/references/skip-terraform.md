---
sidebar_position: 3000
---

# Skipping terraform plan and apply

tfaction can tell you that `terraform plan` and `apply` are unnecessary for a given root module.
Two things trigger this:

1. `skip_terraform_files`: only files matching the configured patterns under the working directory are modified
1. The skip label: a label named `<label_prefixes.skip><target>` is added to the pull request

The [list-targets](actions.md#list-targets) action makes the decision and reports it as the `skip_terraform` field of each target.
Your workflow has to act on that field, either by gating the `plan` and `apply` steps with it or by passing it as the `TFACTION_SKIP_TERRAFORM` environment variable.
Either way, the feature requires a workflow that runs jobs from list-targets output. See [Monorepo](monorepo.md).

Only terraform plan and apply are skipped; other operations such as linting and formatting still run.

## Gate the plan and apply steps

```yaml title=".github/workflows/test.yaml"
- uses: suzuki-shunsuke/tfaction@latest
  if: matrix.target.skip_terraform != true
  with:
    action: plan
```

```yaml title=".github/workflows/apply.yaml"
- uses: suzuki-shunsuke/tfaction@latest
  if: matrix.target.skip_terraform != true
  with:
    action: apply
```

Both steps must be gated.
If only the plan step is gated, no plan file is uploaded to GitHub Artifacts and the apply step fails while downloading it.

## TFACTION_SKIP_TERRAFORM

If the `TFACTION_SKIP_TERRAFORM` environment variable is `true`, the plan and apply actions warn and do nothing.
This is a backstop for workflows that don't gate the steps, so that a missing gate doesn't silently plan and apply a root module that was supposed to be skipped.

```yaml title=".github/workflows/test.yaml"
jobs:
  plan:
    env:
      TFACTION_SKIP_TERRAFORM: ${{matrix.target.skip_terraform}}
```

Gating the steps is still recommended, because then the actions don't run at all.
The environment variable isn't applied to drift detection jobs, where terraform plan always has to run.

## Drift Detection

If [Drift Detection](drift-detection.md) is enabled, set `TFACTION_SKIP_TERRAFORM` in the apply job so that the [update-drift-issue](actions.md#update-drift-issue) action does not close the drift issue when apply was skipped:

```yaml title=".github/workflows/apply.yaml"
jobs:
  apply:
    env:
      TFACTION_SKIP_TERRAFORM: ${{matrix.target.skip_terraform}}
```

Don't gate the update-drift-issue step itself.
It has to keep running with `if: always()` so that a failure elsewhere in the job still comments on the drift issue and reopens it.
`TFACTION_SKIP_TERRAFORM` only suppresses closing the issue.

## skip_terraform_files

When only files matching `skip_terraform_files` under a working directory are modified, `skip_terraform` becomes `true`.
This is intended to avoid unnecessary terraform plan and apply runs when editing files that do not affect their results.
This feature is disabled by default.

```yaml title="tfaction-root.yaml"
skip_terraform_files:
  - "**/*.md" # Ignore markdown edits. Paths are relative to each working directory
  - "!README.md" # Do not ignore README.md at the working directory root
```

Lines starting with `!` are negation patterns that exclude files matched by preceding globs.

## Skip label

Adding a `skip:<target>` label to a pull request sets `skip_terraform` to `true` for that target.
The prefix is `skip:` by default and can be changed with `label_prefixes.skip`.

```yaml title="tfaction-root.yaml"
label_prefixes:
  skip: "skip:"
```

This is useful when you know the plan is meaningless or harmful for a specific root module, for example when [moving resources across states](tfmigrate.md#moving-resources-across-states).
