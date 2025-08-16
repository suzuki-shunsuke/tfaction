---
sidebar_position: 80
---

# Safe Apply with Plan File

Apply safely with Terraform Plan file created by Pull Request.

tfaction's Workflow

1. `terraform plan` is run in the Pull Request CI
1. you check the plan result
1. apply the result by merging the pull request

In this case, it is important to apply the same result as the result of `terraform plan` of the pull request CI.
Otherwise, unexpected changes may be applied.

tfaction stores the latest Terraform Plan files to GitHub Actions' Artifacts per pull request and working directory, and downloading them when `terraform apply` is run.

## tfaction v0.7.0 migrated plan files to GitHub Actions' Artifacts

tfaction ever stored plan files to S3 or GCS, but tfaction v0.7.0 migrated them to [GitHub Actions Artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts).
By this change you don't have to create and manage S3 or GCS.
Furthermore, S3 or GCS had security risks that plan files could be tampered.
GitHub Actions Artifacts can be uploaded files only in the associated workflow run and can't be tampered from outside of the workflow run.

GitHub Actions Artifacts has the retention period so plan files are removed after the retension period.
The default retention period is 90 days, and we think it is enough.
