---
sidebar_position: 3400
---

# Testing Workflow Changes

When GitHub Actions workflows are modified, it is desirable to verify that they still work correctly.
If workflows are modified but no working directories are changed, you can configure tfaction to run plan and apply on specified working directories.
Add the configuration to tfaction-root.yaml.

```yaml title="tfaction-root.yaml"
test_workflow:
  working_directories:
    # If no working directories are modified, plan and apply are run on the directories specified here
    - test
  changed_files:
    # Run workflow tests when these files are changed
    - .github/workflows/test.yaml
    - .github/actions/test/**
    - .github/workflows/apply.yaml
```
