---
sidebar_position: 700
description: Skip terraform for some dependency update
---

# Skip terraform for Renovate

[#151](https://github.com/suzuki-shunsuke/tfaction/issues/151) [#153](https://github.com/suzuki-shunsuke/tfaction/issues/153)

tfaction supports skipping `terraform plan` and `terraform apply` in case of pull request by Renovate.

Basically in tfaction's workflow `terraform plan` and `terraform apply` are run.
But you don't have to run `terraform plan` and `terraform apply` when some dependencies such as tfsec and tflint are updated.
On the other hand, when Terraform and Terraform Providers are updated, you have to run `terraform plan` and `terraform apply`.

By skipping `terraform plan` and `terraform apply`, you can efficiently update dependencies.

* You can prevent unexpected changes from being applied
* [You can prevent CI failure due to `terraform plan`'s unexpected changes](renovate.md)
* You can prevent API rate exceeded by `terraform plan` and `terraform apply`

## How to use

To enable this feature, set `skip_terraform_by_renovate` in `tfaction-root.yaml`.

```yaml
skip_terraform_by_renovate: true
```

Then `terraform plan` and `terraform apply` are skipped in pull requests by Renovate.

This is useful to update dependencies which are unrelated to the result of `terraform plan` and `terraform apply`.

But you should run `terraform plan` and `terraform apply` when Terraform or Terraform Providers are updated by Renovate.
So please set `renovate_terraform_labels` in `tfaction-root.yaml` and [addLabels](https://docs.renovatebot.com/configuration-options/#addlabels) in `renovate.json`.

e.g.

```yaml
renovate_terraform_labels:
- terraform
```

```json
{
  "packageRules": [
    {
      "matchManagers": ["terraform", "terraform-version"],
      "addLabels": ["terraform"]
    },
    {
      "matchPackageNames": ["hashicorp/terraform"],
      "addLabels": ["terraform"]
    }
  ]
}
```

The second rule is required if you manage Terraform with [aqua](https://aquaproj.github.io/).

If any one of labels in `renovate_terraform_labels` is set to the pull request, tfaction would run `terraform plan` and `terraform apply`.
