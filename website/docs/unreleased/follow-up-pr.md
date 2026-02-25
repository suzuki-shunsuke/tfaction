---
sidebar_position: 1000
---

# Follow-up PR

When `terraform apply` fails in tfaction, you need to resolve the failure.
tfaction downloads the plan file from GitHub Artifacts and runs `terraform apply`.
Once `terraform apply` fails, the plan file becomes stale, and rerunning the failed workflow run will fail again.
Therefore, you need to create a new PR.

:::info
If the workflow fails due to a transient error before `terraform apply` runs, rerunning the workflow may resolve the issue.
:::

tfaction can automate the creation of this PR.
This automatically created PR is called a "follow-up PR."
Add the `create-follow-up-pr` action after the `apply` action:

```yaml
- name: Apply
  uses: suzuki-shunsuke/tfaction@latest
  with:
    action: apply
    github_token: ${{ steps.token.outputs.token }}

# Add this after apply
- name: Create follow up PR
  uses: suzuki-shunsuke/tfaction@latest
  if: failure()
  with:
    action: create-follow-up-pr
    github_token: ${{ steps.token.outputs.token }}
```

Review the apply error message and the plan result of the follow-up PR to fix the problem.
If the follow-up PR's plan result is "No Change", it is most likely safe to simply close the follow-up PR without any action.
