# list-working-dirs

GitHub Actions to list working directories

## Example

```yaml
- uses: suzuki-shunsuke/tfaction/list-working-dirs@main
  id: working_dirs
- run: cat "${{ steps.working_dirs.outputs.file }}"
# tests/foo/tfaction.yaml
# tests/bar/tfaction.yaml
# ...
```

## Inputs

Nothing.

## Outputs

name | type | description
--- | --- | ---
file | string (an absolute file path) | Output file path 
