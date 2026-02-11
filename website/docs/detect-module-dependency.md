---
sidebar_position: 800
---

# Run Terraform When a Dependent Local-Path Module is Updated

By default, list-targets lists updated root modules, but if a root module references a module by traversing up the directory hierarchy, updating that referenced module does not add the root module to the list.

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

By enabling `update_local_path_module_caller` in tfaction-root.yaml, root modules will also be added to the list when a dependent module is updated.

```yaml:tfaction-root.yaml
update_local_path_module_caller:
  enabled: true
```

Internally, dependencies are analyzed using a tool called [terraform-config-inspect](https://github.com/hashicorp/terraform-config-inspect).

This feature is relatively popular, but personally I am not a big fan of it.

1. It takes time
    1. terraform-config-inspect needs to be built from source
    1. terraform-config-inspect must be run on all root modules, so execution time increases proportionally with the number of root modules
1. Plan and apply run simultaneously on all dependent root modules
    1. You cannot apply to a development environment before production
    1. If a problem occurs in one root module causing a plan failure or a dangerous change, it blocks applying to all other root modules
