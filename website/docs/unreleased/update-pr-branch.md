---
sidebar_position: 2800
---

# Automatic PR Branch Updates

tfaction automatically updates PR branches. There are two types of updates:

1. After running terraform apply on the default branch, PRs that modify the same root module are automatically updated
1. When CI runs on a PR, the PR branch is automatically updated if it is outdated

## 1. Automatic Update After Apply

When terraform apply is run for a root module, PRs that modify the same root module need to be updated and have terraform plan run again.
Otherwise, reviews based on an outdated plan are unreliable, and the plan file in GitHub Artifacts becomes stale, causing apply to fail even if the PR is merged.

tfaction updates these PRs automatically by default, so users do not need any special configuration.
If you want to disable automatic updates, you can simply not run the `update-pr-branch` action in your workflow.
That said, as mentioned above, updating before merging is necessary, so disabling this is not recommended.

- Adding the `tfaction:disable-auto-update` label to a PR prevents that PR from being automatically updated

## 2. Automatic Update During PR CI

When CI runs on a PR, the `setup` action compares the feature branch with the base branch and automatically updates the feature branch if it is outdated.
The update is triggered when either of the following conditions is met:

1. Files under the root module have been updated on the base branch
1. 300 or more files have been updated on the base branch
   1. Due to a limitation of GitHub's Compare Two Commits API, diffs can only be retrieved for up to 300 files. If 300 or more files have been updated, there is a possibility that files under the root module have been changed on the base branch

Unlike type 1, this feature currently cannot be disabled.
This is because type 1 has the drawback of unnecessarily updating stale PRs, whereas type 2 only triggers when CI is run on a PR.
