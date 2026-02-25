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
securefix_action:
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
    securefix_action_app_id: ${{vars.CSM_APP_ID}}
    securefix_action_app_private_key: ${{secrets.CSM_APP_PRIVATE_KEY}}
```
