---
sidebar_position: 800
---

# Trigger Terraform When Dependent Local-path Modules Are Updated

By default, `list-targets` lists only the root modules that were directly updated.
However, if a root module references a module via a relative path outside its directory, the root module will not be included in the list when only the referenced module is updated.

```
foo/
  tfaction.yaml
  main.tf # References ../modules/db
modules/
  db/
    main.tf
```

```tf title="foo/main.tf"
module "db" {
  source = "../modules/db"
}
```

By enabling `update_local_path_module_caller` in `tfaction-root.yaml`, root modules will also be included in the list when their dependent modules are updated.

```yaml title="tfaction-root.yaml"
update_local_path_module_caller:
  enabled: true
```

Internally, tfaction analyzes dependencies with [terraform-config-inspect](https://github.com/hashicorp/terraform-config-inspect), or with `tofu show -module` for OpenTofu.

## OpenTofu

If `terraform_command` of a directory is `tofu`, tfaction runs `tofu show -module=. -json` in the directory instead of terraform-config-inspect.
OpenTofu older than 1.11.0 doesn't support `-module`, so tfaction uses terraform-config-inspect for it.
`terraform_command` is resolved for each directory in the same order as other settings: `tfaction_module.yaml` (or `tfaction.yaml`) > `target_groups` > `tfaction-root.yaml`.
No setting is needed.

`tofu show -module` reads the configuration with OpenTofu's own loader, so it also detects modules called from `.tofu` files and module sources that use static evaluation.
It doesn't need Go or terraform-config-inspect.

`tofu` must be available in the list-targets job.
tfaction runs `aqua i -l -a` in the directory first, so OpenTofu defined in aqua.yaml works.
If `tofu` isn't found, list-targets fails.

If a value of static evaluation (module `source` / `version`, provider `for_each`, etc.) uses a variable whose value list-targets doesn't know, `tofu show -module` fails with `Unable to compute static value`.
Then tfaction uses terraform-config-inspect for the directory.
Values given only to the plan job, such as `env` in `tfaction.yaml` or `TF_VAR_*` set in the plan job, aren't visible to list-targets.
Set them in the list-targets job to use `tofu show -module`.

If `tofu show -module` fails for another reason, for example the directory has configuration that only Terraform accepts, list-targets fails.
To use terraform-config-inspect for such a directory, set `terraform_command: terraform` in its `tfaction.yaml` or `tfaction_module.yaml`.

Directories under `target_groups[].template_dir` aren't analyzed.

## Drawbacks

While this feature is relatively popular, it has some drawbacks:

1. It is time-consuming
   1. `terraform-config-inspect` needs to be built from source (not with `tofu show -module`)
   2. It must be run for every root module, so execution time scales linearly with the number of root modules
1. All dependent root modules run `plan` and `apply` simultaneously
   1. You cannot apply to a dev environment before production, for example
   2. If one root module fails or contains a dangerous change, it blocks the apply for all other dependent root modules
