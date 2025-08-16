---
sidebar_position: 850
---

# Drift Detection

_Check the drift periodically and track it using GitHub Issues_

![image](https://user-images.githubusercontent.com/13323303/233079963-68765f2e-1efd-4278-b6c3-145eae9ef9c0.png)

tfaction >= v0.6.0

[#851](https://github.com/suzuki-shunsuke/tfaction/issues/851) [#876](https://github.com/suzuki-shunsuke/tfaction/pull/876)

Blogs:

- [2023-06-05 tfaction による Terraform の Drift Detection](https://zenn.dev/shunsuke_suzuki/articles/tfaction-drift-detection)
- [2023-06-05 Terraform's Drift Detection by tfaction](https://dev.to/suzukishunsuke/terraforms-drift-detection-by-tfaction-1dkh)

Drift Detection is the feature to detect `drift`. You can track the drift using GitHub Issues and resolve the drift continuously.

:::caution
This feature detects `drift` but doesn't resolve it automatically. You have to resolve it yourself.
:::

This feature is disabled by default. To enable this feature, please see [Set up](#setup).

tfaction creates GitHub Issues per working directory and manages each working directory's drift with GitHub Issues.

![image](https://user-images.githubusercontent.com/13323303/232356635-0772278e-fc07-4cb2-a48e-a0e97c1cfd10.png)

tfaction opens an Issue when a drift is detected, and closes the Issue when the drift is resolved.

tfaction creates only one Issue per working directory and reuses the same issue.
If `drift` is detected again after `drift` is resolved once, tfaction reopens the same issue instead of creating a new issue.

tfaction checks if the drift exists at the following timing.

1. A pull request is merged and `terraform apply` or `tfmigrate apply` are run
1. `terraform plan` is run periodically by a dedicated GitHub Actions Workflow

The result of `terraform apply`, `tfmigrate apply`, or `terraform plan` is posted to the issue. The comment has links to the GitHub Actions Workflow and the pull request.

e.g. An Issue was opened because `terraform apply` failed.

![image](https://user-images.githubusercontent.com/13323303/233077124-4db0f8a5-1f82-4abd-b0b4-fb641fcee85e.png)

e.g. An Issue was closed because `terraform apply` succeeded and the drift was resolved.

![image](https://user-images.githubusercontent.com/13323303/232356803-e1c7298f-362c-4f00-96f0-20f2ac8720f7.png)

e.g. Drift is checked periodically.

![image](https://user-images.githubusercontent.com/13323303/233079030-67bd01cc-b6bf-425a-bdeb-82447a31904a.png)

![image](https://user-images.githubusercontent.com/13323303/233079963-68765f2e-1efd-4278-b6c3-145eae9ef9c0.png)

## Requirements

- tfaction >= v0.6.0
- tfaction-go >= v0.1.2
- **github-comment >= v5.2.1**
- **tfcmt >= v4.3.0**

## Set up

1. Update tfaciton-root.yaml
1. Install tfaction-go by aqua
1. Add two GitHub Actions workflows
1. Update the apply workflow
1. Run `schedule-create-drift-issues.yaml` manually only once

### 1. Update tfaciton-root.yaml

Please configure Drift Detection.

```yaml
drift_detection: {} # Enable Drift Detection with the default settings
```

```yaml
drift_detection:
  enabled: true
  issue_repo_owner: suzuki-shunsuke # Repository owner of GitHub Issues. By default, Repository where GitHub Actions is run
  issue_repo_name: tfaction-example # Repository name of GitHub Issues. By default, Repository where GitHub Actions is run
  num_of_issues: 1 # The number of issues that scheduled job handles. The default value is `1`
  minimum_detection_interval: 1 # The default value is 168 (7 days). The scheduled workflow picks out working directories whose issues were updated before `minimum_detection_interval` hours
```

By default, drift issues are created in the same repository where tfaction is run.
If you change the repository, you have to use GitHub App token or personal access token instead of GitHub Actions token because GitHub Actions token can't access the other repository.

### 2. Install tfaction-go by aqua

Please install [tfaction-go](https://github.com/suzuki-shunsuke/tfaction-go) in the repository root `aqua.yaml`.

```console
$ aqua g -i suzuki-shunsuke/tfaction-go
```

### 3. Add two GitHub Actions workflows

Please run these workflows periodically.

1. [schedule-create-drift-issues.yaml](https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/schedule-create-drift-issues.yaml): Create Drift Issues periodically
1. [schedule-detect-drifts.yaml](https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/schedule-detect-drifts.yaml): Test if each working directory has a drift periodically
1. (Optional) [sync-drift-issue-description.yaml](https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/sync-drift-issue-description.yaml): Synchronize Drift Issue's description with the latest issue comment

#### 3.1. schedule-create-drift-issues.yaml

1. Create Issues
1. Archive Issues whose working directories are not found

:::tip
This workflow closes issues immediately because drift detection isn't run against those working directories when issues are created.
Issues will be reopened when the drift will be detected.
:::

#### 3.2. schedule-detect-drifts.yaml

1. Pick out some Issues not checked recently and check the drift and updates Issues
1. Archive Issues whose working directories are not found

`tfaction-root.yaml`'s following settings affect the workflow.

```yaml
drift_detection:
  num_of_issues: 1 # The maximum number of issues that scheduled job handles. The default value is `1`
  minimum_detection_interval: 1 # The default value is 168 (7 days). The scheduled workflow picks out working directories whose issues were updated before `minimum_detection_interval` hours
```

This workflow picks out at most `num_of_issues` working directories whose issues were updated before `minimum_detection_interval` hours and checks if they have drifts.

The pseudo query to pick out issues is like the following.

```
repo:${repo} "Terraform Drift" in:title sort:updated-asc updated:<${now - minimum_detection_interval(hour)}
```

This means if all drift issues were updated within `minimum_detection_interval` hours from now, no working directory aren't picked out.

:::tip
Why is the parameter `minimum_detection_interval` needed?
That is because the drift is checked by not only scheduled workflow but also apply workflow.
If the apply workflow is run recently against a working directory, the scheduled workflow doesn't have to check the same working directory.
So tfaction updates drift issues by not only the scheduled workflow but also the apply workflow, and restricts the target of the scheduled workflow by issue's last updated time and `minimum_detection_interval`.
:::

#### 3.3. sync-drift-issue-description.yaml

If you want to reflect the latest drift detection's result to drift issue's description, please add the workflow to the repository drift issues are created.

[sync-drift-issue-description.yaml](https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/sync-drift-issue-description.yaml) :warning: Please change `github.actor` properly

This workflow is optional.

![image](https://github.com/suzuki-shunsuke/tfaction-docs/assets/13323303/2e95f528-8c5d-410c-8dec-fe0dabd3e85a)

### 4. Update the apply workflow

Please add some steps to `terraform-apply` and `tfmigrate-apply` jobs.

1. Run `tfaction get-or-create-drift-issue` before `tfaction/setup`

[example](https://github.com/suzuki-shunsuke/tfaction-example/blob/e8688924120f65c48839850a980feb241ac80dd8/.github/workflows/apply.yaml#L65-L68)

```yaml
- run: tfaction get-or-create-drift-issue
  shell: bash
  env:
    GITHUB_TOKEN: ${{ github.token }}

- uses: suzuki-shunsuke/tfaction/setup@v0.6.0
```

This step gets a drift issue for the working directory.
If a drift issue isn't found, a new issue is created.
The environment variables about the drift issue are set.

2. Run `tfaction/update-drift-issue` in the end of the jobs. Set `if: always()` to run the step definitely.

[example](https://github.com/suzuki-shunsuke/tfaction-example/blob/e8688924120f65c48839850a980feb241ac80dd8/.github/workflows/apply.yaml#L84-L88)

```yaml
- uses: suzuki-shunsuke/tfaction/update-drift-issue@v0.6.0
  if: always()
  with:
    status: ${{job.status}}
    github_token: ${{steps.generate_token.outputs.token}}
```

This step closes or reopens the drift issue according to the job result.
If the job fails the issue is reopened. Or if the job succeeds the issue is closed.

:::caution
You have to update tfaction of all steps to v0.6.0 or later. If old tfaction is used in other steps drift detection doesn't work well.
:::

### 5. Run `schedule-create-drift-issues.yaml` manually only once

Drift Detection doesn't work well if GitHub Issues don't exist. So please run the workflow manually to create issues only once.

## Enable drift detection against only specific working directories

By default Drift Detection is enabled against all working directories, but you can enable Drift Detection against only specific working directories.

The priority is as following.

1. tfaction.yaml's `drift_detection`
1. target group's `drift_detection`
1. tfaction-root.yaml's `drift_detection`

e.g.

tfaction-root.yaml

```yaml
drift_detection:
  enabled: false

target_groups:
  - working_directory: aws/
    # ...
    drift_detection:
      enabled: true
```

tfaction.yaml

```yaml
drift_detection:
  enabled: false
```

## GitHub Access Token

The permission `issues: write` is required to update GitHub Issues.

## GitHub Issue's title

Please don't change GitHub Issue's title basically because tfaction identifies issues using the title.
The title must be unique.

If you change a target name of a working directory and you want to keep using the same drift issue,
please change the issue title properly. Otherwise, tfaction will close the issue and create a new issue.

## Adjust the frequency of Drift Detection

Please adjust the frequency of Drift Detection as you like.

- The schedule of GitHub Actions Workflow
- Drift Detection's configuration
  - num_of_issues
  - minimum_detection_interval

This depends on the number of working directories. Please pay attention to the cost and API rate limiting if you increase the frequency.

The following table shows the example.

| No. | the number of working directory | frequency of workflow | `num_of_issues` | frequency per working directory (/ 1 times) |
| --- | ------------------------------- | --------------------- | --------------- | ------------------------------------------- |
| 1   | 10                              | 1 / hour              | 1               | 10 hour                                     |
| 2   | 7                               | 1 / day               | 1               | 1 week                                      |
| 3   | 1000                            | 1 / 30 min            | 3               | 1 week                                      |

## How to handle issues

Even if issues are created by Drift Detection,
there is no meaning if you don't resolve them.

How to use this feature is completely up to you, but we have some advice.

- Don't handle all issues by only you. Handle issues by teams
- Create a strategy to handle issues continuously
- Create rules to handle issues and write a guide so that everyone can handle issues properly
- Rotate person in charge of handling issues
- Leave the issue handling to each working directory's owners
- Review and improve the issue handling periodically

The real time notification to the chat tool may be noisy and exhaust you, so we recommend making the time to check issues periodically (e.g. daily or weekly) rather than the real time notification.

## How to save cost 💰

If you want to save cost, there are some options.

1. Decrease the frequency of `schedule-detect-drifts` workflow
1. Stop running `schedule-detect-drifts` workflow. Even if `schedule-detect-drifts` is stopped, drift issues are updated according to the result of `terraform apply` and `tfmigrate apply`. Maybe this is enough useful
1. Use GitHub Actions Self hosted runner
