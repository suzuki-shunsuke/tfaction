---
sidebar_position: 1120
description: Dependency resolution of local-path Module
---

# local-path Module

tfaction >= v1.3.0 [#1528](https://github.com/suzuki-shunsuke/tfaction/pull/1528)

By default, tfaction runs CI on only working directories where any code is updated.
This means even if a working directory depends on a [local path Module](https://developer.hashicorp.com/terraform/language/modules/sources#local-paths) out of the working directory and the module is updated, CI isn't run on the working directory.

e.g.

- A working directory A depends on local path Module B
- Module B is located out of the working directory A
- In a pull request C, working directory A isn't changed but the module B is changed
- Then CI isn't run on the working directory A by default

```
working directory A/
modules/
  module B
```

To run CI on the working directory A too, please update tfaction-root.yaml as the following.

tfaction-root.yaml

```yaml
update_local_path_module_caller:
  enabled: true
```

This feature depends on [terraform-config-inspect](https://github.com/hashicorp/terraform-config-inspect), so you have to install it.
Same with other tools, you can install terraform-config-inspect with [aqua](https://aquaproj.github.io/).

e.g.

```yaml
packages:
  - name: hashicorp/terraform-config-inspect
    version: a34142ec2a72dd916592afd3247dd354f1cc7e5c
```

In that case, Go is required.

If this feature is enabled, when a module is updated in a pull request, CI is run on working directories depending on the module.
The module dependency is checked recursively.
For example, in the above case if the module B depends on a module C and module C is updated in a pull request,
CI is run on the working directory A even if the working directory A and the module B aren't updated.
