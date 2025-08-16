---
sidebar_position: 1100
---

# Destroy resources

[#1291](https://github.com/suzuki-shunsuke/tfaction/pull/1291) [#1343](https://github.com/suzuki-shunsuke/tfaction/pull/1343) tfaction >= v1.0.0

Support destroying resources with `terraform plan`'s `-destroy` option.

If you want to destroy all resources, please set `destroy: true` in `tfaction.yaml`.

tfaction.yaml

```yaml
destroy: true
```

## Clean up codes

If you want to clean up codes after destroying resources, please remove the working directory simply.

## :bulb: Disable Renovate to keep codes

If you want to keep codes after destroying resources,
it's good to prevent Renovate from updating dependencies on the working directory.

1. [ignorePaths](https://docs.renovatebot.com/configuration-options/#ignorepaths)

```json
{
  "ignorePaths": ["aws/foo/dev"]
}
```
