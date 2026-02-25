---
sidebar_position: 1100
---

# Automatic PR Branch Updates

tfaction automatically updates PR branches. There are two types of updates.

1. After running terraform apply on the default branch, PRs that modify the same root module are automatically updated.
1. When CI runs on a PR, the PR branch is automatically updated if it is behind the base branch.

## 1. Automatic Update After Apply

When terraform apply is executed for a root module, PRs that modify the same root module need to be updated and have terraform plan re-run.
Otherwise, reviews based on an outdated plan are unreliable, and the plan file in GitHub Artifacts becomes stale, causing apply to fail even if the PR is merged.

By running the update-pr-branch action after the apply action, you can automate this update.

```yaml
- name: Update related PR branches
  uses: suzuki-shunsuke/tfaction@latest
  if: always()
  with:
    action: update-pr-branch
    github_token: ${{ steps.token.outputs.token }}
```

If you do not want automatic updates, simply do not run the update-pr-branch action. However, as mentioned above, updating before merging is necessary, so this is not recommended.
You can also add the `tfaction:disable-auto-update` label to a PR to prevent that PR from being automatically updated.

## 2. Automatic Update During PR CI

When CI runs on a PR, the `setup` action compares the feature branch with the base branch and automatically updates the feature branch if it is behind.
The update is triggered when either of the following conditions is met:

1. Files under the root module have been updated on the base branch.
1. 300 or more files have been updated on the base branch.
   - Due to a limitation of GitHub's Compare Two Commits API, which can only return diffs for up to 300 files, there is a possibility that files under the root module were updated when the total exceeds 300.

Unlike type 1, this feature cannot currently be disabled.
This is because type 1 has the drawback of unnecessarily updating stale PRs, whereas type 2 only triggers when CI is actually run on a PR.
