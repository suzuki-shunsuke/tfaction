---
sidebar_position: 1220
---

# Follow-up PR Group Labels

`tfaction >= v1.16.0`, [#2431](https://github.com/suzuki-shunsuke/tfaction/pull/2431)

This feature is disabled by default.

You can add pull request labels to group original pull requests and follow-up pull requests.

tfaction-root.yaml:

```yaml
follow_up_pr_group_label:
  enabled: true # The default is false
  prefix: "tfaction:follow-up-pr-group/"
```

When the apply workflow fails, a pull request label is created and is added to an original pull request and new follow-up pull requests.
If the apply workflow fails again when a follow-up pull request is merged, a follow-up PR Group label of the follow-up pull request is added to a new follow-up pull request.

For instance, let's say a pull request #100 fails, and a follow-up PR #110 is created.
And a follow-up PR #110 fails, and a follow-up PR #120 is created.
In this case, a follow-up PR group label `tfaction:follow-up-pr-group/100` is added to pull requests #100, #110, and #120.
These pull requests are grouped by a label `tfaction:follow-up-pr-group/100`.
You can search pull requests by label.
