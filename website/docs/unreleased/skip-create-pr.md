---
sidebar_position: 1800
---

# Disable PR creation

tfaction has features that automatically create PRs, but you can limit it to only creating commits and branches without creating PRs.

```yaml
skip_create_pr: true
```

When disabled, instead of creating a PR, tfaction outputs a GitHub CLI command that you can copy and paste to create the PR yourself.
This means the PR author will be you rather than an app, which resolves the following issues caused by app-authored PRs:

1. Poor experience with app-created PRs
   1. You do not receive notifications when the PR is reviewed or merged
   1. The PR does not appear in your list of created PRs
1. Security risks
   1. You can push changes to an app-created PR and self-approve it

## Not receiving notifications when the PR is reviewed or merged

See [Notify bot PR events](./notify-bot-pr-event).

## PR does not appear in your list of created PRs

When filtering PRs by author in the Web UI search or API, app-created PRs are inconvenient.
While you can filter by assignee, needing to use both author and assignee filtering is cumbersome.

## Self-approval of app-created PRs

GitHub's design prevents you from approving your own PRs, which guards against self-approval.
However, for app-created PRs, anyone can push changes and then self-approve.

While not a tfaction feature, [validate-pr-review-app](https://github.com/suzuki-shunsuke/validate-pr-review-app) and CSM Actions can mitigate this issue.
