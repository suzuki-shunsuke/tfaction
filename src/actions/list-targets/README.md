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
    "environment": "production"
  }
]
```

- `target`: Alias for `working_directory`. Defaults to the same value as `working_directory`
- `runs_on`: Job execution environment. Defaults to `ubuntu-latest`
- `environment`: GitHub Environments

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
