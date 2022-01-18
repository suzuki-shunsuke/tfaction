# list-targets

GitHub Actions to list targets

## Example

```yaml
- uses: suzuki-shunsuke/tfaction/list-targets@main
  id: list-targets
```

## Inputs

### Required Inputs

Nothing.

### Optional Inputs

name | type | default | description
--- | --- | --- | ---
working_dir_file | string (file name) | ci.yaml | working directory file name
base_directory | string (file path) | '.' (current directory) | base directory
config | string (file path) | tfaction.yaml | configuration file path

## Outputs

name | type | description
--- | --- | ---
tfmigrate_targets | []object | List of tfmigrate targets
terraform_targets | []object | List of terraform targets
