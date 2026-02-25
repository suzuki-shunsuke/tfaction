---
sidebar_position: 2400
---

# Destroying All Resources in a Root Module

To destroy all resources in a root module, set `destroy: true` in `tfaction.yaml`.

```yaml title="tfaction.yaml"
destroy: true
```

This causes terraform plan to run with the `-destroy` option.
After apply completes and all resources are destroyed, you can then delete the directory entirely.

Note that if you delete the directory before destroying the resources, the resources will remain as-is.
If you want to stop managing resources with Terraform while keeping them intact, deleting the directory without destroying is acceptable.

## Preventing Renovate from Running on Directories Marked for Destruction

It is generally not appropriate for Renovate to update code in directories where `destroy: true` is set.
You can exclude these directories using Renovate's [ignorePaths](https://docs.renovatebot.com/configuration-options/#ignorepaths).

```json title="renovate.json"
{
  "ignorePaths": ["aws/foo/dev"]
}
```
