---
sidebar_position: 2800
---

# Drift Detection

![image](https://user-images.githubusercontent.com/13323303/233079963-68765f2e-1efd-4278-b6c3-145eae9ef9c0.png)

tfaction's Drift Detection checks whether the infrastructure definition in code diverges from the actual infrastructure state for each root module, and manages the results by creating a GitHub Issue per root module.
By managing drift as issues, you can visualize drift status and handle it at your own pace.
This feature is disabled by default. You can enable or disable it per root module, allowing gradual adoption starting with specific root modules or disabling it for particular ones.

## What is Drift Detection?

Here, "Drift" refers to a divergence between the infrastructure definition in code and the actual infrastructure state in IaC. "Drift Detection" is the process of detecting such drift.

Drift Detection is an important topic in IaC, not just Terraform. When drift becomes the norm, the reliability of code is lost.
When making changes, unrelated diffs are detected, requiring you to investigate what the diff is and whether it is safe to apply, which reduces productivity.
Quickly detecting and resolving drift is essential in IaC.

## tfaction's Drift Detection

tfaction's Drift Detection only detects drift; it does not automatically resolve it.
You need to resolve drift yourself.

tfaction manages drift by creating a GitHub Issue for each root module.

![image](https://github.com/suzuki-shunsuke/tfaction-docs/assets/13323303/2e95f528-8c5d-410c-8dec-fe0dabd3e85a)

When drift is detected, the issue is reopened. When drift is resolved, the issue is closed.

Only one issue is created per root module, and it is reused continuously.
In other words, when drift occurs again after being resolved, tfaction reopens the existing issue rather than creating a new one.

Drift Detection runs at the following times:

- During apply execution (`terraform apply`, `tfmigrate apply`)
- During scheduled execution of the `schedule-detect-drifts` GitHub Actions Workflow

Drift is detected by running plan or apply on each root module.
If the plan result is "No change" or apply succeeds, drift is considered absent and the issue is closed.
Conversely, if the plan result is not "No change" or apply fails, drift is considered present and the issue is reopened.

The plan and apply results are posted as comments on the issue.
Comments include links to the workflow run and pull request.

![image](https://user-images.githubusercontent.com/13323303/232356803-e1c7298f-362c-4f00-96f0-20f2ac8720f7.png)

Since plan and apply results are recorded as comment history on the issue, you can easily track when drift occurred by looking at the issue.
You can also reflect the latest comment into the issue description, so you can see the latest results without scrolling through all comments.

![image](https://github.com/suzuki-shunsuke/tfaction-docs/assets/13323303/2e95f528-8c5d-410c-8dec-fe0dabd3e85a)

During scheduled plan execution, plans are run for up to n root modules whose issues have the oldest last-updated timestamps.
Since results are commented on issues during plan and apply execution, the issue's last-updated timestamp gets updated.
Therefore, an older last-updated timestamp means drift detection has not been run for a while.

When Drift Detection is enabled, it is enabled for all root modules by default, but you can also enable or disable it for specific root modules.

## Warning: Do not change the issue title

tfaction searches for issues by their title, so do not change the title.
Do not create issues for other purposes that start with `Terraform Drift`.
Titles must be unique.

If a root module's target name is changed, tfaction automatically creates a new issue for that root module.
If you want to keep the same issue, update its title to match the new target name.
If you want to recreate an issue for any reason, rename or delete the old issue.

If a root module corresponding to an issue is no longer found (e.g., because it was deleted), tfaction automatically renames and closes the issue.

![archive-issue](https://user-images.githubusercontent.com/13323303/232516561-66cd8dbf-7617-4527-9544-47166e8d6cf6.png)

## Enable in tfaction-root.yaml

Drift Detection is disabled by default.

```yaml
drift_detection: {}
```

```yaml
drift_detection:
  enabled: true
  # Repository where issues are created. Defaults to the repository where tfaction runs.
  issue_repo_owner: suzuki-shunsuke
  issue_repo_name: tfaction-example
  # Maximum number of drift issues processed per scheduled job run. Default is 1.
  num_of_issues: 1
  minimum_detection_interval: 1
```

Once drift detection is performed for a directory, it will not be checked again for the same directory for a period defined by `minimum_detection_interval`.
This prevents excessive drift checks on the same directory.
The default is 168 hours (7 days).

You can enable or disable drift detection per target group or root module.

```yaml
target_groups:
  - working_directory: "**"
    drift_detection:
      enabled: true
```

```yaml
drift_detection:
  enabled: true
```

## Create a workflow to periodically detect drift

```yaml
name: Detect drift
on:
  workflow_dispatch:
    inputs: {}
  schedule:
    # hourly
    - cron: "*/5 * * * *"
jobs:
  pick-out:
    timeout-minutes: 10
    runs-on: ubuntu-24.04
    outputs:
      issues: ${{steps.pick-out.outputs.issues}}
      has_issues: ${{steps.pick-out.outputs.has_issues}}
    permissions:
      contents: read
      issues: read
    steps:
      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1
        with:
          persist-credentials: false
      - uses: suzuki-shunsuke/tfaction@latest
        id: pick-out
        with:
          action: pick-out-drift-issues

  detect:
    timeout-minutes: 60
    name: "detect (${{matrix.issue.target}})"
    runs-on: ${{matrix.issue.runs_on}}
    needs: pick-out
    permissions:
      issues: write
      contents: read
    if: fromJSON(needs.pick-out.outputs.has_issues)
    strategy:
      fail-fast: false
      matrix:
        issue: ${{fromJSON(needs.pick-out.outputs.issues)}}
    steps:
      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1
        with:
          persist-credentials: false

      - uses: suzuki-shunsuke/tfaction@latest
        with:
          action: set-drift-env
          issue: ${{toJSON(matrix.issue)}}

      - uses: suzuki-shunsuke/tfaction@latest
        with:
          action: setup

      - uses: suzuki-shunsuke/tfaction@latest
        with:
          action: test

      - uses: suzuki-shunsuke/tfaction@latest
        with:
          action: plan

      - uses: suzuki-shunsuke/tfaction@latest
        if: always()
        with:
          action: update-drift-issue
          status: ${{job.status}}
```

## Create a workflow to periodically create drift issues

```yaml
name: Create drift issues
on:
  workflow_dispatch:
    inputs: {}
  schedule:
    # daily
    - cron: "0 0 * * *"
jobs:
  create-drift-issues:
    timeout-minutes: 30
    runs-on: ubuntu-24.04
    permissions: {}
    steps:
      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1
        with:
          persist-credentials: false

      - uses: suzuki-shunsuke/tfaction@latest
        with:
          action: create-drift-issues
```

## Modify the apply workflow

Add a step at the beginning of the job to get or create a drift issue:

```yaml
- uses: suzuki-shunsuke/tfaction@latest
  with:
    action: get-or-create-drift-issue
```

Add a step at the end of the job to update the drift issue:

```yaml
- uses: suzuki-shunsuke/tfaction@latest
  if: always()
  with:
    action: update-drift-issue
    status: ${{job.status}}
```

## Operational recommendations

Enabling Drift Detection and having issues created is meaningless unless you actually resolve the drift based on them.
How you resolve drift is of course up to you and depends on team/organization size, structure, and policies.
Here are some ideas for how to operate it (assuming a relatively large organization):

1. Add issues to a GitHub Project
1. Regularly check the Project (Kanban) board (e.g., every morning), assign people to open issues, and handle them

Running this as a one-person effort is unsustainable, so rotating within the team is recommended.
If each root module has a product team with ownership, it is ideal to have the product team handle the issues (although this can be difficult in practice).

If you want real-time notifications, tfaction's Drift Detection itself does not have a real-time notification mechanism, but you can integrate Slack with GitHub to send notifications, or trigger a workflow on issue events in GitHub Actions.
However, real-time notifications can generate a lot of noise and cause unnecessary fatigue, so they are not personally recommended.
