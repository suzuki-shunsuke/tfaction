---
sidebar_position: 2700
---

# Secure Commits and PR Creation with CSM Actions

By default, tfaction uses the `github_token` input when creating commits and PRs.
Therefore, `github_token` requires `contents:write` permission.
This access token can generally be used from the CI of any pull request in the repository where tfaction runs.
Misusing this access token could allow creating arbitrary commits and PRs, which is undesirable from a security standpoint.
This applies not only to tfaction but to any CI process that creates commits or PRs.

CSM Actions is a set of actions that solves this problem by implementing a Client/Server Model in GitHub Actions.

https://github.com/csm-actions/docs

tfaction natively supports CSM Actions, allowing you to create commits and PRs through it.
By adopting CSM Actions, you can remove the `contents:write` permission from `github_token` (GitHub App).

1. First, set up the server-side GitHub Actions following the CSM Actions documentation.

- [Securefix Action](https://github.com/csm-actions/securefix-action)
- [Update Branch Action](https://github.com/csm-actions/update-branch-action)

At the same time, create the client-side GitHub App and register it in GitHub Secrets.

1. Specify the CSM Actions server repository in tfaction-root.yaml.

```yaml
csm_actions:
  server_repository: csm-actions-server
  pull_request:
    base_branch: main
```

1. Pass the CSM Actions GitHub App ID and Private Key to the action.

```yaml
- uses: suzuki-shunsuke/tfaction@latest
  with:
    action: plan
    github_token: ${{steps.generate_token.outputs.token}}
    csm_app_id: ${{vars.CSM_APP_ID}}
    csm_app_private_key: ${{secrets.CSM_APP_PRIVATE_KEY}}
```

## Keeping the private key in AWS KMS

A GitHub App private key in GitHub Secrets never expires, so anyone who obtains it can create commits and PRs through CSM Actions for as long as the key stays registered on the app.

Importing the key into AWS KMS removes that path. The key can never be exported, and tfaction only asks KMS to sign the JSON Web Token that authenticates as the app.

Set `csm_aws_kms_key_id` instead of `csm_app_private_key`. Passing it as a key ARN is enough, since an ARN carries its region; `csm_aws_region` covers an alias name or a bare key id.

Set `csm_aws_role_to_assume` and tfaction assumes the IAM role itself with the GitHub OIDC token. The AWS credentials then stay inside the action and are never exported, so later steps of the job can't see them. The job needs the `id-token: write` permission.

```yaml
permissions:
  id-token: write # Required to assume the AWS IAM role via OIDC

steps:
  - uses: suzuki-shunsuke/tfaction@latest
    with:
      action: plan
      github_token: ${{steps.generate_token.outputs.token}}
      csm_client_id: ${{vars.CSM_APP_CLIENT_ID}}
      csm_aws_kms_key_id: ${{vars.CSM_KMS_KEY_ID}}
      csm_aws_role_to_assume: ${{vars.CSM_ROLE_TO_ASSUME}}
```

The KMS key must be an RSA 2048 key whose usage is `SIGN_VERIFY`, created with `--origin EXTERNAL` so that the GitHub App's existing private key can be imported into it. The IAM role needs `kms:Sign` on that key, and its trust policy has to allow the repository running tfaction.

Leaving `csm_aws_role_to_assume` unset reads the credentials from `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_SESSION_TOKEN`, which is what [aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials) exports. Signing reads nothing else, so leave `aws-profile` unset on that action: a profile in `~/.aws/credentials` doesn't reach the signing, and neither does IMDS on a self-hosted EC2 runner. This applies to the signing only. tfaction's other AWS calls, such as reading a plan file from S3 or a secret from Secrets Manager, still go through the AWS SDK and resolve credentials as they always did.

`csm_client_id` identifies the app by its Client ID, which GitHub recommends over the App ID. `csm_app_id` still works, and takes second place when both are set.
