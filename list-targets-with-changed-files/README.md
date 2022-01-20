# list-targets-with-changed-files

GitHub Actions to list targets

## Example

```yaml
- run: ci-info run | sed "s/^export //" >> "$GITHUB_ENV"
- uses: suzuki-shunsuke/tfaction/list-working-dirs@main
  id: working-dirs
- uses: suzuki-shunsuke/tfaction/list-targets-with-changed-files@main
  id: list-targets
  with:
    changed_files: ${{ env.CI_INFO_TEMP_DIR }}/pr_all_filenames.txt
    labels: ${{ env.CI_INFO_TEMP_DIR }}/labels.txt
    config_files: ${{ steps.working-dirs.outputs.file }}
```

## Inputs

### Required Inputs

name | type | description
--- | --- | ---
changed_files | string (file path) | a file path where the list of changed file paths are written
labels | string (file path) | a file path where the list of pull request labels are written
config_files | string (file path) | a file path where the list of configuration file paths are written

## Outputs

name | type | description
--- | --- | ---
tfmigrate_targets | []object | List of tfmigrate targets
terraform_targets | []object | List of terraform targets
