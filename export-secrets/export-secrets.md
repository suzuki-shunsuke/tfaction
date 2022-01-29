# export-secrets

GitHub Actions to export secrets as environment variables

## Example

```yaml
- uses: suzuki-shunsuke/tfaction/export-secrets@main
  with:
    secrets: ${{ secrets }}
```

## Environment variables

`TFACTION_TARGET` is required.

## Inputs

Nothing.

## Outputs

Nothing.
