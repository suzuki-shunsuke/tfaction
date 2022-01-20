# get-global-config

GitHub Actions to get global configuration

## Example

```yaml
steps:
- uses: suzuki-shunsuke/tfaction/get-global-config@main
  id: global-config
```

## Inputs

Nothing.

## Outputs

name | description
--- | ---
base_working_directory | base directory of working directories
working_directory_file | file name which locates on working directories
renovate_login | Renovate login
label_prefix_target | label prefix for target
label_prefix_tfmigrate | label prefix for tfmigrate
label_prefix_ignore | label prefix for ignore
