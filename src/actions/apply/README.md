# apply

Runs terraform apply or tfmigrate apply.

## Inputs

All inputs are optional.

- `github_token`
- `github_token_for_github_provider`
- `secrets`

## Environment variables

- `TFACTION_JOB_TYPE`

## Steps

1. Download the plan file from GitHub Artifacts
   - Fails if `plan_workflow_name` is incorrect
2. Run terraform apply and notify via tfcmt
3. If drift detection is enabled, update the drift issue
4. Update branches of other PRs that modify the same root module

## Skipping apply

This action doesn't check `skip_terraform` by itself.
To skip apply, gate the step with the `skip_terraform` field of the [list-targets](../list-targets/README.md) output.

```yaml
- uses: suzuki-shunsuke/tfaction@latest
  if: matrix.target.skip_terraform != true
  with:
    action: apply
```
