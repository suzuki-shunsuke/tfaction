# check-terraform-skip

GitHub Actions to check if terraform plan and apply are skipped

## Example

```yaml
- uses: suzuki-shunsuke/tfaction/check-terraform-skip@main
  id: check-terraform-skip
  with:
    labels: ${{ env.CI_INFO_TEMP_DIR }}/labels.txt
    pr_author: ${{ env.CI_INFO_PR_AUTHOR }}
```

## Inputs

### Required Inputs

name | type | description
--- | --- | ---
labels | string | a file path to pull request labels
pr_author | string | pull request author

## Outputs

name | type | description
--- | --- | ---
skip_terraform | boolean | whether terraform is skipped
