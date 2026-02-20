---
sidebar_position: 300
---

# Hide Old PR Comments

In the workflow built in [Getting Started](getting-started), tfcmt posts comments on pull requests.  
However, one issue is that old comments remain and continue to accumulate.

![](https://storage.googleapis.com/zenn-user-upload/0082918de91c-20260208.png)

There are two solutions:

1. Hide old comments using [github-comment hide](https://suzuki-shunsuke.github.io/github-comment/hide/)
2. Use [tfcmt plan -patch](https://suzuki-shunsuke.github.io/tfcmt/plan-patch/) to update existing comments instead of creating new ones

We recommend option 1.

## github-comment hide

1. Add `github-comment` to `aqua.yaml`

```sh
aqua g -i suzuki-shunsuke/github-comment
```

2. Install `github-comment` via aqua in GitHub Actions and run `github-comment hide`

```yaml
packages:
  - name: suzuki-shunsuke/github-comment@v6.4.1
```

```yaml
---
# yaml-language-server: $schema=https://raw.githubusercontent.com/suzuki-shunsuke/github-comment/v6.3.1/json-schema/github-comment.json
# https://github.com/suzuki-shunsuke/github-comment
hide:
  default: |
    Comment.HasMeta && Comment.Meta.SHA1 != Commit.SHA1 && ! (Comment.Meta.Program == "tfcmt" && Comment.Meta.Command == "apply")
```

```yaml
on: pull_request
jobs:
  hide-comment:
    timeout-minutes: 10
    runs-on: ubuntu-24.04
    permissions:
      contents: read
    steps:
      - name: Checkout Repository
        uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1
        with:
          persist-credentials: false

      - name: Install aqua
        uses: aquaproj/aqua-installer@11dd79b4e498d471a9385aa9fb7f62bb5f52a73c # v4.0.4
        with:
          aqua_version: v2.56.6

      - name: Create GitHub App installation access token
        uses: actions/create-github-app-token@29824e69f54612133e76f7eaac726eef6c875baf # v2.2.1
        id: token
        with:
          app-id: ${{ vars.APP_ID }}
          private-key: ${{ secrets.PRIVATE_KEY }}
          permission-pull-requests: write

      - name: Hide old comments
        run: github-comment hide
        env:
          GITHUB_TOKEN: ${{ steps.token.outputs.token }}
```

With this setup, old comments will be hidden.

![](https://storage.googleapis.com/zenn-user-upload/bd7b16acc7af-20260208.png)

## tfcmt plan -patch

Create a tfcmt configuration file:

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/suzuki-shunsuke/tfcmt/v4.14.1/json-schema/tfcmt.json
# https://github.com/suzuki-shunsuke/tfcmt
plan_patch: true
```

This causes `terraform plan` and `apply` comments to be updated instead of creating new ones.

![](https://storage.googleapis.com/zenn-user-upload/c4224657d761-20260208.png)

However, tfaction does not only post comments via tfcmt.
Older comments created by tools other than tfcmt will still remain.

Therefore, it is recommended to combine this with `github-comment hide`.
That said, if you do so, you might conclude that using only `github-comment hide` is sufficient.

For example:

```yaml
---
# yaml-language-server: $schema=https://raw.githubusercontent.com/suzuki-shunsuke/github-comment/v6.3.1/json-schema/github-comment.json
# https://github.com/suzuki-shunsuke/github-comment
hide:
  # Do not hide comments created by tfcmt
  default: |
    Comment.HasMeta && Comment.Meta.SHA1 != Commit.SHA1 && Comment.Meta.Program != "tfcmt"
```
