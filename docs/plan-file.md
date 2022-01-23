# Apply safely with Terraform Plan File

Apply safely with Terraform Plan file created by Pull Request.

tfaction's Workflow

1. `terraform plan` is run in the Pull Request CI
1. you check the plan result
1. apply the result by merging the pull request

In this case, it is important to apply the same result as the result of `terraform plan` of the pull request CI.
Otherwise, unexpected changes may be applied.

tfaction stores the latest Terraform Plan files to the AWS S3 or Google Cloud Storage bucket per pull request and working directory, and downloading them when `terraform apply` is run.
