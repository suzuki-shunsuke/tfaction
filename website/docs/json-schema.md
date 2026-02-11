---
sidebar_position: 400
---

# JSON Schema for Configuration Files

Both `tfaction-root.yaml` and `tfaction.yaml` provide JSON Schemas.

By adding the following comment at the top of the configuration file, editors such as VSCode can enable validation and auto-completion, helping prevent configuration mistakes.

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/suzuki-shunsuke/tfaction/refs/heads/latest/schema/tfaction-root.json
```

The URL includes a JSON Schema reference (either a branch or a tag).

You can pin a specific tfaction version and automate updates using the Renovate preset
[github>suzuki-shunsuke/renovate-config:yaml-language-server](https://github.com/suzuki-shunsuke/renovate-config/blob/main/yaml-language-server.json).

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
