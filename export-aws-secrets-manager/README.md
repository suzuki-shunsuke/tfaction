# export-aws-secrets-manager

GitHub Actions to export AWS Secrets Manager's secrets as environment variables

## Example

```yaml
- uses: suzuki-shunsuke/tfaction/export-aws-secrets-manager@main
  with:
    secrets: ${{ toJSON(secrets) }}
```

## Configuration

e.g.

```yaml
terraform_plan_config:
  aws_secrets_manager:
  - secret_id: atlas_api_key
    envs:
    - env_name: ATLAS_API_PUBLIC_KEY
      secret_key: public_key
    - env_name: ATLAS_API_PRIVATE_KEY
      secret_key: private_key
```

## Environment variables

`TFACTION_TARGET` is required.

## Inputs

Nothing.

## Outputs

Nothing.
