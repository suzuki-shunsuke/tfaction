---
sidebar_position: 3400
---

# Testing Workflow Changes

When GitHub Actions workflows are modified, it is desirable to verify that they still work correctly.
If workflows are modified but no working directories are changed, you can configure tfaction to run plan and apply on specified working directories.

`test_workflow` provides two blocks:

- `only_plan`: only `plan` is run on these directories. `apply` is skipped. This is useful when you want to verify a workflow without applying any real changes — for example, when running `apply` on a production directory would cause drift, or when a `null_resource` placeholder is not enough to exercise the workflow.
- `plan_and_apply`: both `plan` and `apply` are run on these directories.

Add the configuration to tfaction-root.yaml.

```yaml title="tfaction-root.yaml"
test_workflow:
  only_plan:
    working_directories:
      # If no working directories are modified, plan is run on the directories specified here.
      # apply is NOT run on these directories.
      - test/diff
    changed_files:
      # Run plan-only workflow tests when these files are changed
      - .github/workflows/test.yaml
      - .github/actions/test/**
  plan_and_apply:
    working_directories:
      # If no working directories are modified, plan and apply are run on the directories specified here
      - test/nodiff
    changed_files:
      # Run plan-and-apply workflow tests when these files are changed
      - .github/workflows/apply.yaml
```

Both blocks are optional, so you can configure either one or both.
A working directory must not appear in both `only_plan` and `plan_and_apply`; doing so causes a validation error.
