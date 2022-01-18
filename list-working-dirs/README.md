# list-working-dirs

GitHub Actions to list working directories

## Example

```yaml
- uses: suzuki-shunsuke/tfaction/list-working-dirs@main
  id: working_dirs
  with:
    file: ci.yaml
    base_directory: tests
- run: cat "${{ steps.working_dirs.outputs.file }}"
# tests/foo/ci.yaml
# tests/bar/ci.yaml
# ...
```

## Inputs

### Required Inputs

name | type | description
--- | --- | ---
file | string (file name) | file name which exists in working directories

### Optional Inputs

name | type | default | description
--- | --- | --- | ---
base_directory | string (file path) | `.` | base directory to search working directories

## Outputs

name | type | description
--- | --- | ---
file | string (an absolute file path) | Output file path 
