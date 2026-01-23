# list-targets

## Overview

`list-targets` is an action to output changed working directories and modules.
It outputs the following outputs.

- targets: JSON string.
- modules: JSON String. A list of paths to modules

targets:

```yaml
- target: github/foo
  working_directory: github/services/foo # A relative path from tfaction-root.yaml
  runs_on: ubuntu-latest # Or list
  job_type: terraform # tfmigrate
  environment:
    env_name: main
    url: https://example.com
  secrets:
    - env_name:
      secret_name:
```

modules:

```yaml
- modules/foo # A relative path from tfaction-root.yaml to module
```

## Usage

```yaml
setup:
  outputs:
    targets: ${{steps.list-targets.outputs.targets}}
    modules: ${{steps.list-targets.outputs.modules}}
```

```yaml
uses: suzuki-shunsuke/tfaction@latest
id: list-targets
with:
  action: list-targets
```

## Detail

- In case of PR event, validate if the current commit is latest
- List all working directories and modules by searching files `tfaction.yaml` and `tfaction_module.yaml`
- If `.update_local_path_module_caller?.enabled` is true, adding working directories where dependent modules are changed to the output `targets`
  - Run `terragrunt render --json` and `terraform-config-inspect`
- Create pairs of working directory and target based on all working directories, `target_groups`, and `replace_target`
- Merge config of the global config, `target_groups`, and `tfaction.yaml` for each working directory
- Handle PR labels (tfmigrate and skip labels)
- Create lists of working directories and modules based on changed files, working directories and dependent modules
- Validate the number of changed working directories and modules based on `.limit_changed_dirs?.working_dirs` and `.limit_changed_dirs?.modules`
  - By default, no limitation

## list module caller

list-module-caller detects dependent modules by `terragrunt` and `terraform-config-inspect`.
It creates pairs of working directories and dependent modules.

```yaml
foo: # working directory
  - ../modules/a
  - ../modules/b
```

Then it is converted to pairs of modules and working directories.

```yaml
../modules/a:
  - foo
  - bar
```

### terragrunt

Check all working directories.
If `terragrunt.hcl` exists, run terragrunt.
Check terragrunt version and change the command according to the version.

- `>= 0.77.17`: `terragrunt render --json --write --out`
- `>= 0.73.0`: `terragrunt render-json --out`
- `< 0.73.0`: `terragrunt render-json --terragrunt-json-out`

terragrunt outputs a JSON string.

```json
{
  "terraform": {
    "source": "../modules/foo"
  }
}
```

`.terraform.source` is a relative path from the working directory.
If `.terraform.source` starts with `..`, the working directory depends on `.terraform.source`.

### terraform-config-inspect

Run `terraform-config-inspect --json` in all working directories.
It outputs a JSON string.

```json
{
  "module_calls": {
    "foo": {
      "source": "../modules/foo"
    }
  }
}
```

`.module_calls.*.source` is a relative path from the working directory to module.
