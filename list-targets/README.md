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

name | default | description
--- | --- | ---
github_token | `secrets.GITHUB_TOKEN` | GitHub Access Token

## Outputs

name | type | description
--- | --- | ---
tfmigrate_targets | []object | List of tfmigrate targets
terraform_targets | []object | List of terraform targets
