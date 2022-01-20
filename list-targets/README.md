# list-targets

GitHub Actions to list targets

## Example

```yaml
- uses: suzuki-shunsuke/tfaction/list-targets@main
  id: list-targets
```

## Inputs

Nothing.

## Outputs

name | type | description
--- | --- | ---
tfmigrate_targets | []object | List of tfmigrate targets
terraform_targets | []object | List of terraform targets
