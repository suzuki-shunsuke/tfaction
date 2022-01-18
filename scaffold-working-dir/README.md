# scaffold-working-dir

## Requirements

* [aqua](https://aquaproj.github.io/)

## Example

```yaml
- uses: suzuki-shunsuke/tfaction/scaffold-working-dir@main
  with:
    target: github/foo
```

## Inputs

### Required Inputs

name | type | description
--- | --- | ---
target | string | target

### Optional Inputs

name | type | default | description
--- | --- | --- | ---
config | string (file path) | tfaction.yaml | Configuration file path

## Outputs

name | type | description
--- | --- | ---
working_directory | file path | Working Directory
