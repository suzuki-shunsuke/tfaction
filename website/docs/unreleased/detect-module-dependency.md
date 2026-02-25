---
sidebar_position: 800
---

# Trigger Terraform When Dependent Local-path Modules Are Updated

By default, `list-targets` lists only the root modules that were directly updated. However, if a root module references a module via a relative path outside its directory, the root module will not be included in the list when only the referenced module is updated.

```
foo/
  tfaction.yaml
  main.tf # References ../modules/db
modules/
  db/
    main.tf
```

```tf
module "db" {
  source = "../modules/db"
}
```

By enabling `update_local_path_module_caller` in `tfaction-root.yaml`, root modules will also be included in the list when their dependent modules are updated.

```yaml
update_local_path_module_caller:
  enabled: true
```

Internally, tfaction uses [terraform-config-inspect](https://github.com/hashicorp/terraform-config-inspect) to analyze dependencies.

While this feature is relatively popular, it has some drawbacks:

1. It is time-consuming
   1. `terraform-config-inspect` needs to be built from source
   2. It must be run for every root module, so execution time scales linearly with the number of root modules
1. All dependent root modules run `plan` and `apply` simultaneously
   1. You cannot apply to a dev environment before production, for example
   2. If one root module fails or contains a dangerous change, it blocks the apply for all other dependent root modules
