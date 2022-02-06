# export-secrets

GitHub Actions to export secrets as environment variables

## Example

```yaml
- uses: suzuki-shunsuke/tfaction/export-secrets@main
  with:
    secrets: ${{ toJSON(secrets) }}
```

## Environment variables

`TFACTION_TARGET` is required.

## Inputs

### Required Inputs

name | type | description
--- |------| ---
secrets | json | secrets of GitHub repository

## Outputs

Nothing.
