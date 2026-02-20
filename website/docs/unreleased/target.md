---
sidebar_position: 1500
---

# Configuring Targets (Aliases)

The relative path from the Git repository root to the root module is used in PR comments, PR labels, and other places.
In large or long-lived monorepos, these paths can often be verbose, complex, and lengthy.
Additionally, GitHub PR labels have a 50-character limit, and exceeding this limit can cause label creation to fail.
To address this, tfaction provides a feature to shorten the relative path to a root module.

```yaml
replace_target:
  patterns:
    # Replacements are applied from top to bottom using regular expressions
    - regexp: /services/
      replace: /
    - regexp: /production/ # Shorten production to prod
      replace: /prod/
```
