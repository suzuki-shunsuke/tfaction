---
sidebar_position: 2600
---

# Module

tfaction also provides features for managing modules (not root modules).
To manage a module with tfaction, create a `tfaction.yaml` in the module's directory and set `type: module`.

```yaml title="tfaction.yaml"
type: module
```

## Scaffolding a Module from a Template

See [Creating a Root Module from a Template](./scaffold-working-directory.md).

## Testing a Module

See [Lint](./lint.md).

## Releasing a Module

Specify the module path and version to generate a GitHub Tag and Release.

```yaml title=".github/workflows/release_module.yaml"
name: Release a Terraform Module
run-name: Release a Terraform Module (${{inputs.module_path}} / ${{inputs.version}})
on:
  workflow_dispatch:
    inputs:
      module_path:
        description: "Module path"
        required: true
      version:
        description: "module version"
        required: true
env:
  TFACTION_TARGET: ${{inputs.module_path}}
jobs:
  release-module:
    timeout-minutes: 10
    name: "release-module (${{inputs.module_path}})"
    runs-on: ubuntu-26.04
    permissions:
      contents: write
    steps:
      - name: Checkout Repository
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: aquaproj/aqua-installer@82d0e83878a8657c4a6f2ff1755d3bfbfc67f329 # v4.1.0
        with:
          aqua_version: v2.56.6
        env:
          AQUA_GITHUB_TOKEN: ${{github.token}}
      - uses: suzuki-shunsuke/tfaction@latest
        with:
          action: release-module
          version: ${{inputs.version}}
          module_path: ${{inputs.module_path}}
```
