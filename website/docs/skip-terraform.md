---
sidebar_position: 2600
---

# Skipping terraform plan and apply

If only files matching `skip_terraform_files` under a working directory are modified, terraform plan and apply are skipped.
This is intended to skip unnecessary terraform plan and apply runs when editing files that do not affect their results.
This feature is disabled by default.

```yaml:tfaction-root.yaml
skip_terraform_files:
  - "**/*.md" # Ignore markdown edits
```

Only terraform plan and apply are skipped; other linting and formatting steps still run.
