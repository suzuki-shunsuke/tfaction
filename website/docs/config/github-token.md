---
sidebar_position: 250
---

# GitHub Access Token

tfaction requires a GitHub Access Token.

## Use GitHub App instead of the secret `GITHUB_TOKEN`

Some actions pushes commits to pull requests or create new pull requests, but the secret `GITHUB_TOKEN` doesn't trigger a GitHub Actions workflow run.

https://docs.github.com/en/actions/security-guides/automatic-token-authentication#using-the-github_token-in-a-workflow

> When you use the repository's GITHUB_TOKEN to perform tasks, events triggered by the GITHUB_TOKEN will not create a new workflow run.

So we recommend issuing an access token from a GitHub App.
There are some GitHub Actions to issue an access token from a GitHub App.

- https://github.com/tibdex/github-app-token
- https://github.com/actions/create-github-app-token
- https://github.com/cybozu/octoken-action

To create a GitHub App, please see [the official document](https://docs.github.com/en/developers/apps/building-github-apps/creating-a-github-app).

You can also use a personal access token, but we recommend GitHub App in terms of security.

## Required permissions of the secret `GITHUB_TOKEN`

If you use [OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect), probably the permission `id-token: write` is required.

```yaml
permissions:
  id-token: write
```

## Required permissions of GitHub Access token

- `contents: write`
  - Create commits and branches
- `pull_requests: write`
  - Open pull requests
  - Post comments to pull requests
  - Add labels to pull requests
  - Review pull requests by reviewdog
- `issues: read`
  - [Search related pull requests with labels](/tfaction/docs/feature/auto-update-related-prs)
    - `gh pr list`'s `-l` option requires the permission
- `issues: write`
  - Create labels
- `actions: read`
  - [Download plan files from GitHub Artifacts](/tfaction/docs/feature/plan-file)

## Refer to tfaction-example

About the permission, please see [tfaction-example](https://github.com/suzuki-shunsuke/tfaction-example/tree/main/.github/workflows) too.

tfaction composes of multiple actions, and each action requires different permissions.
So in terms of the least privilege, you should issue a token per action.
From the example, you can see what permissions each action requires.

e.g.

https://github.com/suzuki-shunsuke/tfaction-example/blob/9e353a7b1938715a0b1238342720d3d2011f35a3/.github/workflows/apply.yaml#L134-L155
