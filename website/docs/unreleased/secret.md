---
sidebar_position: 1500
---

# Handling Secrets

tfaction can handle secrets required for terraform init, plan, and apply.
Since each working directory may require different secrets, you can configure which secrets to reference in tfaction-root.yaml and tfaction.yaml.
Both GitHub Secrets and AWS Secrets Manager are supported, but you can of course retrieve secrets from other secret managers yourself.

Exporting secrets as environment variables in an action would make them accessible to any subsequent step's process, which is not desirable from a security perspective.
Instead, tfaction passes secrets as environment variables only during the execution of specific commands such as terraform init, plan, and apply, reducing the security risk.

## GitHub Secrets

Define the mapping between secret names and environment variable names in the configuration file.

```yaml title="tfaction-root.yaml"
target_groups:
  - working_directory: atlas/staging/**
    secrets:
      - env_name: ATLAS_API_KEY
        secret_name: ATLAS_API_KEY_STAGING
```

Pass all secrets to the output-github-secrets action. It outputs only the required secrets, which you then pass to subsequent actions.

```yaml title=".github/workflows/test.yaml"
- uses: suzuki-shunsuke/tfaction@latest
  id: github-secrets
  with:
    action: output-github-secrets
    github_secrets: ${{ toJSON(secrets) }}

- uses: suzuki-shunsuke/tfaction@latest
  with:
    action: terraform-init
    github_secrets: ${{ steps.github-secrets.outputs.secrets }}
```

## AWS Secrets Manager

Define the mapping between secret IDs and environment variable names.
You can also specify keys within JSON-formatted secrets.

```yaml title="tfaction-root.yaml"
target_groups:
  - working_directory: foo/**
    aws_secrets_manager:
      - secret_id: foo
        envs:
          - env_name: FOO_API_KEY
```

After authenticating with AWS, run the `output-aws-secrets-manager` action and pass its output to subsequent actions.

```yaml title=".github/workflows/test.yaml"
- uses: suzuki-shunsuke/tfaction@latest
  with:
    action: setup

- uses: aws-actions/configure-aws-credentials@61815dcd50bd041e203e49132bacad1fd04d2708 # v5.1.1
  if: steps.setup.outputs.aws_assume_role_arn != ''
  with:
    role-to-assume: ${{ steps.setup.outputs.aws_assume_role_arn }}
    role-session-name: ${{ steps.setup.outputs.aws_role_session_name }}
    aws-region: ${{ steps.setup.outputs.aws_region }}

- uses: suzuki-shunsuke/tfaction@latest
  id: aws-secrets-manager
  with:
    action: output-aws-secrets-manager

- uses: suzuki-shunsuke/tfaction@latest
  with:
    action: terraform-init
    aws_secrets: ${{ steps.aws-secrets-manager.outputs.secrets }}
```
