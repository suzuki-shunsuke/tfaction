---
sidebar_position: 1700
---

# Dismiss approval before plan

The plan action dismisses approvals immediately after running `terraform plan`, forcing reviewers to approve after seeing the plan results.
This feature is enabled by default, but it can be disabled.

```yaml
dismiss_approval_before_plan:
  enabled: true # true by default
  skip_app_no_change: true # true by default
```

When a PR created by an app such as Renovate results in "No Change", approvals are not dismissed by default.
This is to avoid blocking automatic merging of such PRs.
