---
sidebar_position: 300
---

# Secrets Management

tfaction supports two types of secrets management.

1. [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
1. [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)

### GitHub Secrets

You can export GitHub Secrets as environment variables with [export-secrets](https://github.com/suzuki-shunsuke/tfaction/tree/main/export-secrets) Action.

```yaml
- uses: suzuki-shunsuke/tfaction/export-secrets@main
  with:
    secrets: ${{ toJSON(secrets) }}
```

Target Group Configuration

e.g.

```yaml
target_groups:
- working_directory: atlas/staging/
  # ...
  secrets:
  # export the secret `ATLAS_API_KEY_STAGING` as the environment variable `ATLAS_API_KEY`
  - env_name: ATLAS_API_KEY
    secret_name: ATLAS_API_KEY_STAGING
```

Job Configuration

e.g.

```yaml
target_groups:
- working_directory: atlas/staging/
  # ...
  terraform_plan_config:
    # ...
    secrets:
    - env_name: ATLAS_API_KEY
      secret_name: ATLAS_API_KEY_STAGING_READ_ONLY
```

:::caution
If secrets aren't set as you expect, please check if secrets are passed to this action properly.
If you use reusable workflows, maybe secrets aren't passed to the reusable workflow.
If so, please pass secrets properly.

- https://docs.github.com/en/actions/using-workflows/reusing-workflows#passing-inputs-and-secrets-to-a-reusable-workflow
- https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idsecrets

From tfaction v1.3.1, the action outputs the list of secrets passed to the action as a log.
So please check the log.

e.g.

```
Run suzuki-shunsuke/tfaction/export-secrets@v1.3.1
The list of secret names passed to the action: gh_app_id, gh_app_private_Key, github_token
Error: "secret is not found: FASTLY_API_KEY"
```
:::

### AWS Secrets Manager

You can export AWS Secrets Manager's Secrets as environment variables with [export-aws-secrets-manager](https://github.com/suzuki-shunsuke/tfaction/tree/main/export-aws-secrets-manager) Action.
This action is used in [setup](https://github.com/suzuki-shunsuke/tfaction/tree/main/setup) Action, so you don't have to use this Action explicitly.

Target Group Configuration

e.g.

```yaml
target_groups:
- working_directory: foo/
  # ...
  aws_secrets_manager:
  - secret_id: foo
    envs:
    - env_name: FOO_API_KEY
    # if `secret_key` isn't specified, the whole secret value is exported
```

```yaml
target_groups:
- working_directory: atlas/
  # ...
  aws_secrets_manager:
  - secret_id: atlas
    envs:
    - env_name: ATLAS_API_PUBLIC_KEY
      secret_key: public_key
    - env_name: ATLAS_API_PRIVATE_KEY
      secret_key: private_key
      # if `secret_key` is specified, the secret value is treated as JSON and the specified key is exported
```

Job Configuration

```yaml
target_groups:
- working_directory: atlas/
  # ...
  terraform_plan_config:
    # ...
    aws_secrets_manager:
    - secret_id: atlas
      envs:
      - env_name: ATLAS_API_PUBLIC_KEY
        secret_key: public_key
      - env_name: ATLAS_API_PRIVATE_KEY
        secret_key: private_key
```
