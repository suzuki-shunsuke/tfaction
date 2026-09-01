# plan

Runs terraform plan or tfmigrate plan and comments the results on the PR via tfcmt.
Uploads the plan file in both binary and JSON format to GitHub Artifacts.
If configured, runs Conftest against the plan file.
If the PR is from Renovate and the plan result is not "No Change" and the setting is enabled, disables auto-merge.

## Environment variables

- `TFACTION_SKIP_TERRAFORM`: If `true`, this action warns and does nothing. Not applied to drift detection jobs

## Skipping plan

Gating the step with the `skip_terraform` field of the [list-targets](../list-targets/README.md) output is the recommended way to skip plan, because then this action doesn't run at all.

```yaml
- uses: suzuki-shunsuke/tfaction@latest
  if: matrix.target.skip_terraform != true
  with:
    action: plan
```

`TFACTION_SKIP_TERRAFORM` is a backstop for workflows that don't gate the step.
This action warns when it skips because of the environment variable.
