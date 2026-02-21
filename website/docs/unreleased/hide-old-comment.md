---
sidebar_position: 300
---

# Hide Old PR Comments

In the workflow built in [Getting Started](getting-started), tfcmt posts comments on pull requests.  
However, one issue is that old comments remain and continue to accumulate.

![](https://storage.googleapis.com/zenn-user-upload/0082918de91c-20260208.png)

There are two solutions:

1. Hide old comments using hide-comment action
2. Use [tfcmt plan -patch](https://suzuki-shunsuke.github.io/tfcmt/plan-patch/) to update existing comments instead of creating new ones

We recommend option 1.

## hide-comment action

Run `hide-comment` action.
`pull_request:write` permission is required.

```yaml
- uses: suzuki-shunsuke/tfaction@latest
  with:
    action: hide-comment
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

Therefore, it is recommended to combine this with hide-comment action.
That said, if you do so, you might conclude that using only hide-comment action is sufficient.

```yaml
- uses: suzuki-shunsuke/tfaction@latest
  with:
    action: hide-comment
    if: |
      Comment.HasMeta && Comment.Meta.SHA1 != Commit.SHA1 && Comment.Meta.Program != "tfcmt"
```
