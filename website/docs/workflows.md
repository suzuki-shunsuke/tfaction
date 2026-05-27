---
sidebar_position: 3100
---

# Workflows

tfaction uses several GitHub Actions workflows.
You do not need to create all of these workflows.
For example, if you do not use drift detection, you do not need to create the corresponding workflows.

- GitHub Flow
  - test.yaml: Runs terraform plan, tests, and code fixes on PRs
  - apply.yaml: Runs terraform apply when a PR is merged
- scaffold-tfmigrate.yaml: Generates tfmigrate configuration files and migration files, then pushes a commit or creates a PR
- scaffold-working-directory.yaml: Creates a PR to add a new root module
- import.yaml: Generates code with `terraform plan --generate-config-out`
- Module
  - release-module.yaml: Releases a Terraform Module (creates a GitHub Tag and Release)
- Drift Detection
  - schedule-create-drift-issues.yaml: Periodically creates drift detection issues
  - schedule-detect-drifts.yaml: Periodically runs drift detection
  - sync-drift-issue-description.yaml: Updates the issue description when a new comment is posted on an issue
