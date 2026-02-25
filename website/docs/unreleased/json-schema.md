---
sidebar_position: 400
---

# JSON Schema for Configuration Files

Both `tfaction-root.yaml` and `tfaction.yaml` have JSON Schemas.
By adding the following comment at the top of your configuration file, editors like VSCode will provide validation and autocompletion, helping you avoid configuration mistakes.

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/suzuki-shunsuke/tfaction/refs/heads/latest/schema/tfaction-root.json
```

The URL includes a ref (branch or tag) for the JSON Schema.
You can pin a specific tfaction version and automate updates using the Renovate Preset [github>suzuki-shunsuke/renovate-config:yaml-language-server](https://github.com/suzuki-shunsuke/renovate-config/blob/main/yaml-language-server.json).

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/suzuki-shunsuke/tfaction/refs/tags/v2.0.0/schema/tfaction-root.json
```

```json
{
  "extends": [
    "github>suzuki-shunsuke/renovate-config:yaml-language-server#3.3.1"
  ]
}
```
