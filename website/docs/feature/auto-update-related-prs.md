---
sidebar_position: 100
---

# Automatic update branches

When `terraform plan` or `tfmigrate plan` is run in target `A`,
tfaction sets a pull request label `A`.

When a pull request of the target `A` is merged and `terraform apply` or `tfmigrate apply` is run in target `A`,
tfaction updates pull request branches that have a pull request label `A` by using the [GitHub API](https://docs.github.com/en/rest/reference/pulls#update-a-pull-request-branch).

![image](https://user-images.githubusercontent.com/13323303/151699327-ba31892c-c4a6-47e7-a944-15fca81dfbfb.png)

By updating pull request branch, the result of CI including uploaded Terraform Plan file is updated.
Otherwise,the uploaded Terraform Plan file becomes stale and it would fail to run `terraform apply`.

## Exclude specific pull requests

tfaction >= v0.7.3 [#1272](https://github.com/suzuki-shunsuke/tfaction/pull/1272)

If you want to exclude specific pull requests, please add the pull request label `tfaction:disable-auto-update`.

## Disable this feature

tfaction >= v0.5.23 [#892](https://github.com/suzuki-shunsuke/tfaction/issues/892) [#898](https://github.com/suzuki-shunsuke/tfaction/pull/898)

:::caution
We don't recommend disabling this feature.

> By updating pull request branch, the result of CI including uploaded Terraform Plan file is updated.
> Otherwise, an uploaded Terraform Plan file becomes stale and it would fail to run `terraform apply`.

If this feature is disabled, users may forget to update Terraform Plan files and terraform apply fails.

In some use case the maintainer of workflows and users of workflows are different.
In that case, users aren't familiar with tfaction and they don't know that they have to update the plan file.
And they can't understand the cause when terraform apply fails.

So we recommend enabling this feature, but you can disable this feature at your own risk.
:::

You can disable this feature.

tfaction-root.yaml

```yaml
update_related_pull_requests:
  enabled: false
```
