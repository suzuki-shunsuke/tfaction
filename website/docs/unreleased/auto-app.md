---
sidebar_position: 2200
---

# Auto Apps (Renovate, Dependabot)

Configuration related to PRs created by apps such as Renovate.

## Managing app logins

You can manage a list of GitHub Apps and machine users.
By default, `renovate[bot]` and `dependabot[bot]` are configured.

```yaml
auto_apps:
  logins:
    - "renovate[bot]"
    - "dependabot[bot]"
```

## Preventing auto-merge of dangerous changes

While auto-merging safe Renovate PRs reduces review burden, you need to prevent dangerous changes from being auto-merged.
There are two approaches to prevent auto-merge:

- Disable auto-merge
- Dismiss approval (note that auto-merge occurs if approval is not required)

The default behavior is:

- For app PRs with "No Change" results: auto-merge remains enabled and approval is not dismissed, allowing automatic merge
- For app PRs with changes (not "No Change"): auto-merge is disabled and approval is dismissed, preventing automatic merge

If approval is required to merge a PR, disabling auto-merge is unnecessary and dismissing the approval is sufficient.
In that case, you can prevent auto-merge from being disabled:

```yaml
auto_apps:
  allow_auto_merge_change: true
```

The default settings err on the side of safety.

## Disabling auto-merge

In tfaction v2, when the `terraform plan` result of a Renovate PR is not "No Change", auto-merge is disabled to prevent unexpected changes from being applied automatically.

![](https://storage.googleapis.com/zenn-user-upload/a9426176ff50-20260211.png)

You can also prevent auto-merge from being disabled:

```yaml
auto_apps:
  allow_auto_merge_change: true
```

## Dismissing approval

```yaml
dismiss_approval_before_plan:
  skip_no_change_by_app: true # true by default
```
