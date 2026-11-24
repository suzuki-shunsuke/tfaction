# list-targets

Generates a list of root modules changed in a PR.
Used to run CI only on changed root modules in a monorepo.

No inputs other than the `action` input are required.

## Outputs

The outputs are intended to be used as `env`, `runs-on`, and `environment` in subsequent matrix jobs.

- `targets`: JSON list of changed root modules
- `modules`: JSON list of changed modules

### targets

```json
[
  {
    "target": "github/foo",
    "working_directory": "github/service/foo",
    "runs_on": "ubuntu-latest",
    "job_type": "terraform",
    "environment": "production",
    "skip_terraform": false
  }
]
```

- `target`: Alias for `working_directory`. Defaults to the same value as `working_directory`
- `runs_on`: Job execution environment. Defaults to `ubuntu-latest`
- `environment`: GitHub Environments
- `skip_terraform`: Whether terraform plan and apply are unnecessary. `true` if all changed files match `skip_terraform_files`, or if the skip label is added to the PR. The workflow has to act on this field, either by gating the plan and apply steps with it or by passing it as `TFACTION_SKIP_TERRAFORM`

Example workflow usage:

```yaml
plan:
  name: "plan (${{matrix.target.target}})"
  timeout-minutes: 60
  runs-on: ${{matrix.target.runs_on}}
  environment: ${{matrix.target.environment}}
  needs: [list]
  env:
    TFACTION_TARGET: ${{matrix.target.target}}
    TFACTION_WORKING_DIR: ${{matrix.target.working_directory}}
    TFACTION_JOB_TYPE: ${{matrix.target.job_type}}
  if: "join(fromJSON(needs.list.outputs.targets), '') != ''"
  strategy:
    fail-fast: false
    matrix:
      target: ${{fromJSON(needs.list.outputs.targets)}}
  steps:
    # ...
    - uses: suzuki-shunsuke/tfaction@latest
      if: matrix.target.skip_terraform != true
      with:
        action: plan
```

Settings can be changed in `tfaction-root.yaml`:

```yaml
replace_target:
  patterns:
    - regexp: /services/
      replace: /
target_groups:
  - working_directory: github/services/**
    runs_on: ubuntu-slim
    environment: production
```

### modules

```json
["modules/foo"]
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
  - Run `terragrunt render --json`, and `tofu show -module` or `terraform-config-inspect`
  - Directories under `target_groups[].template_dir` are excluded
- Create pairs of working directory and target based on all working directories, `target_groups`, and `replace_target`
- Merge config of the global config, `target_groups`, and `tfaction.yaml` for each working directory
- Handle PR labels (tfmigrate and skip labels)
- Create lists of working directories and modules based on changed files, working directories and dependent modules
- Validate the number of changed working directories and modules based on `.limit_changed_dirs?.working_dirs` and `.limit_changed_dirs?.modules`
  - By default, no limitation

## list module caller

list-module-caller detects dependent modules by `terragrunt`, and `tofu show -module` or `terraform-config-inspect`.
Directories under `target_groups[].template_dir` are excluded because they are never planned.
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

### Choose the tool for each directory

For each working directory and module, list-module-caller gets `terraform_command` of the directory.
The priority is the same as other actions: `tfaction_module.yaml` (or `tfaction.yaml`) > `target_groups` > `tfaction-root.yaml`.
A directory matching no target group uses its own file and `tfaction-root.yaml`.
If the file can't be read, `terraform_command` in it is ignored with a warning.

If the file name of `terraform_command` without the extension is `tofu` (e.g. `tofu`, `/usr/local/bin/tofu`, `tofu.exe`), list-module-caller uses `tofu show -module`.
Otherwise, it uses `terraform-config-inspect`.

### tofu show -module

In the directory, list-module-caller:

1. Runs `aqua i -l -a` to install OpenTofu defined in aqua.yaml of the directory
1. Runs `<terraform_command> show -module=. -json`

If `tofu` isn't found or `aqua i` fails, list-targets fails with a pull request comment.
If `tofu show` fails with `flag provided but not defined: -module` (OpenTofu < 1.11), list-module-caller uses `terraform-config-inspect`.
`tofu show --help` isn't used to check it, because OpenTofu 1.11 and 1.12 support `-module` but don't list it in the help.

OpenTofu prints the module calls under `.root_module`, and omits `module_calls` when the directory calls no module.

```json
{
  "format_version": "1.0",
  "root_module": {
    "module_calls": {
      "foo": {
        "source": "../modules/foo"
      }
    }
  }
}
```

If `tofu show -module` fails and its error output has `Unable to compute static value`, list-module-caller uses `terraform-config-inspect` for the directory.
This happens when a value of static evaluation (module `source` / `version`, provider `for_each`, etc.) uses a variable whose value list-targets doesn't know, for example a variable given by `env` in `tfaction.yaml` or `TF_VAR_*` in the plan job.
Otherwise, list-targets fails with a pull request comment.

### terraform-config-inspect

Run `terraform-config-inspect --json` in working directories that don't use `tofu show -module`.
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
