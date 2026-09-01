# apply

Runs terraform apply or tfmigrate apply.

## Inputs

All inputs are optional.

- `github_token`
- `github_token_for_github_provider`
- `secrets`

## Environment variables

- `TFACTION_JOB_TYPE`
- `TFACTION_SKIP_TERRAFORM`

## Steps

1. If `TFACTION_SKIP_TERRAFORM` is `true`, warn and do nothing
2. Download the plan file from GitHub Artifacts
   - Fails if `plan_workflow_name` is incorrect
3. Run terraform apply and notify via tfcmt
4. If drift detection is enabled, update the drift issue
5. Update branches of other PRs that modify the same root module

## Skipping apply

Gating the step with the `skip_terraform` field of the [list-targets](../list-targets/README.md) output is the recommended way to skip apply, because then this action doesn't run at all.

```yaml
- uses: suzuki-shunsuke/tfaction@latest
  if: matrix.target.skip_terraform != true
  with:
    action: apply
```

`TFACTION_SKIP_TERRAFORM` is a backstop for workflows that don't gate the step.
This action warns when it skips because of the environment variable.
