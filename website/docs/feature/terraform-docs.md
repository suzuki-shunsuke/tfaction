---
sidebar_position: 1130
---

# terraform-docs

[#1859](https://github.com/suzuki-shunsuke/tfaction/issues/1859) [#1878](https://github.com/suzuki-shunsuke/tfaction/pulls/1878) [v1.8.0](https://github.com/suzuki-shunsuke/tfaction/releases/tag/v1.8.0)

## How to use

By default, this feature is disabled.

tfaction-root.yaml:

```yaml
terraform_docs:
  enabled: true
```

tfaction.yaml:

```yaml
terraform_docs:
  enabled: true
```

## terraform-docs configuration

tfaction searches a configuration file:

1. .terraform-docs.ya?ml in service directory
2. .config/.terraform-docs.ya?ml in service directory
3. .terraform-docs.ya?ml in the repository root directory
4. .config/.terraform-docs.ya?ml in the repository root directory

https://terraform-docs.io/user-guide/configuration/
