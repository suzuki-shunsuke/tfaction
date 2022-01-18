# get-target-config

GitHub Actions to get target configuration

## Example

```yaml
- uses: suzuki-shunsuke/tfaction/get-target-config@main
  id: target-config
  with:
    target: github/foo
    config: config.yaml
    is_apply: 'false'
```

## Inputs

### Required Inputs

name | type | description
--- | --- | ---
target | string | target
config | string (file path) | configuration file path
is_apply | string (`true` or `false`) | whether the apply is run

### Optional Inputs

Nothing.

## Outputs

name | type | description
--- | --- | ---
tfmigrate_targets | []object | List of tfmigrate targets
terraform_targets | []object | List of terraform targets
