# get-global-config

GitHub Actions to get global configuration

## Example

```yaml
steps:
- uses: suzuki-shunsuke/tfaction/get-global-config@main
  id: global-config
```

## Inputs

name | environment variable | default | description
--- | --- | --- | ---
config | TFACTION_CONFIG | `tfaction.yaml` | configuration file path

## Outputs

name | description
--- | ---
renovate_login | Renovate login
label_prefix_target | label prefix for target
label_prefix_tfmigrate | label prefix for tfmigrate
label_prefix_ignore | label prefix for ignore
