# plan

Runs terraform plan or tfmigrate plan and comments the results on the PR via tfcmt.
Uploads the plan file in both binary and JSON format to GitHub Artifacts.
If configured, runs Conftest against the plan file.
If the PR is from Renovate and the plan result is not "No Change" and the setting is enabled, disables auto-merge.

## Skipping plan

This action doesn't check `skip_terraform` by itself.
To skip plan, gate the step with the `skip_terraform` field of the [list-targets](../list-targets/README.md) output.

```yaml
- uses: suzuki-shunsuke/tfaction@latest
  if: matrix.target.skip_terraform != true
  with:
    action: plan
```
