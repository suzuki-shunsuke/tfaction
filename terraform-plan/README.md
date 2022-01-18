# terraform-plan

GitHub Actions to run terraform plan

## Requirements

* Terraform
* AWS CLI
* [conftest](https://www.conftest.dev/)
* [tfcmt](https://github.com/suzuki-shunsuke/tfcmt)
* [github-comment](https://github.com/suzuki-shunsuke/github-comment)

## Example

```yaml
- uses: suzuki-shunsuke/tfaction/terraform-plan@main
  with:
    target: github/foo
    github_app_token: ${{ secrets.GITHUB_APP_TOKEN }}
    s3_bucket_name_plan_file: '<AWS S3 Bucket Name for Terraform Plan files>'
```

## Inputs

### Required Inputs

name | type | description
--- | --- | ---
github_app_token | string | GitHub Access Token. `github.token` can't be used because it can't invoke GitHub Actions Workflow
target | string | target
s3_bucket_name_plan_file | string | AWS S3 Bucket Name for Terraform Plan files

### Optional Inputs

name | type | default | description
--- | --- | --- | ---
github_token | string | `github.token` | GitHub Access Token
working_directory | string (file path) | '' (current directory) | Working Directory

## Outputs

Nothing.
