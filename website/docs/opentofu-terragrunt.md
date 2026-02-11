---
sidebar_position: 2500
---

# Using OpenTofu or Terragrunt

By default, tfaction runs terraform, but you can replace it with a compatible tool such as OpenTofu.

```yaml:tfacion-root.yaml
terraform_command: tofu
target_groups:
  - working_directory: aws
    terraform_command: tofu
```

You can also configure this in tfaction.yaml.

```yaml:tfaction.yaml
terraform_command: terragrunt
```
