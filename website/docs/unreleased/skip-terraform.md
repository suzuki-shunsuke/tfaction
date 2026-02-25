---
sidebar_position: 3000
---

# Skipping terraform plan and apply

When only files matching `skip_terraform_files` under a working directory are modified, terraform plan and apply are skipped.
This is intended to avoid unnecessary terraform plan and apply runs when editing files that do not affect their results.
This feature is disabled by default.

```yaml
skip_terraform_files:
  - "**/*.md" # Ignore markdown edits. Paths are relative to each working directory
  - "!README.md" # Do not ignore README.md at the working directory root
```

Lines starting with `!` are negation patterns that exclude files matched by preceding globs.

Only terraform plan and apply are skipped; other operations such as linting and formatting still run.
