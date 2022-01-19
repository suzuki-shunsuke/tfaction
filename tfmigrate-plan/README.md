# tfmigrate-plan

GitHub Actions to run tfmigrate plan

## Requirements

* [tfmigrate](https://github.com/minamijoyo/tfmigrate)
* AWS CLI
* [ghcp](https://github.com/int128/ghcp)
* [github-comment](https://github.com/suzuki-shunsuke/github-comment)

## Example

```yaml
- uses: suzuki-shunsuke/tfaction/tfmigrate-plan@main
  with:
    target: github/foo
    github_app_token: ${{ secrets.GITHUB_APP_TOKEN }}
    s3_bucket_name_tfmigrate_history: '<AWS S3 Bucket Name for tfmigrate history files>'
    s3_bucket_name_plan_file: '<AWS S3 Bucket Name for Terraform Plan files>'
```

## Inputs

### Required Inputs

name | description
--- | ---
github_app_token | GitHub Access Token. `github.token` can't be used because it can't invoke GitHub Actions Workflow
s3_bucket_name_tfmigrate_history | AWS S3 Bucket Name for tfmigrate history files
s3_bucket_name_plan_file | AWS S3 Bucket Name for Terraform Plan files

### Optional Inputs

name | environment variable | default | description
--- | --- | ---
github_token | | `github.token` | GitHub Access Token
target | TFACTION_TARGET | '' | target
working_directory | | '' (current directory) | Working Directory

## Outputs

Nothing.
