---
sidebar_position: 300
---

# Hiding Old PR Comments

In the workflow built in [Getting Started](./getting-started), tfcmt posts comments to the PR, but old comments remain visible indefinitely.

![](https://storage.googleapis.com/zenn-user-upload/0082918de91c-20260208.png)

There are two solutions:

1. Use the `hide-comment` action to hide old comments
1. Use [tfcmt plan -patch](https://suzuki-shunsuke.github.io/tfcmt/plan-patch/) to update existing comments instead of creating new ones

We recommend option 1.

## hide-comment action

Run the `hide-comment` action in your GitHub Actions workflow.

The `pull_requests: write` permission is required.

```yaml
- uses: suzuki-shunsuke/tfaction@latest
  with:
    action: hide-comment
```

This hides old comments:

![](https://storage.googleapis.com/zenn-user-upload/bd7b16acc7af-20260208.png)

## tfcmt plan -patch

Create a tfcmt configuration file:

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/suzuki-shunsuke/tfcmt/v4.14.1/json-schema/tfcmt.json
# https://github.com/suzuki-shunsuke/tfcmt
plan_patch: true
```

This causes `terraform plan` and `apply` result comments to be updated in place:

![](https://storage.googleapis.com/zenn-user-upload/c4224657d761-20260208.png)

However, tfaction posts comments from sources other than tfcmt, and those old comments will still remain.
It is best to use this in combination with hide-comment action.
That said, if you are using both together, hide-comment action alone may be sufficient.

```yaml
- uses: suzuki-shunsuke/tfaction@latest
  with:
    # Do not hide comments posted by tfcmt
    if: |
      Comment.HasMeta && Comment.Meta.SHA1 != Commit.SHA1 && Comment.Meta.Program != "tfcmt"
```
