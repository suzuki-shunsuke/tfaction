---
sidebar_position: 1700
---

# Dismiss approval before plan

The plan action dismisses approvals immediately after running `terraform plan`, forcing reviewers to approve after seeing the plan results.
This feature is enabled by default, but it can be disabled.

```yaml
dismiss_approval_before_plan:
  enabled: true # true by default
```

When a PR created by an app such as Renovate results in "No Change", approvals are not dismissed.
This is to avoid blocking automatic merging of such PRs.
The apps are configured by `auto_apps.logins`. For details, see [Auto Apps (Renovate, Dependabot)](auto-app.md).
