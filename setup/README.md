# setup

## Requirements

* [ghcp](https://github.com/int128/ghcp)
* [github-comment](https://github.com/suzuki-shunsuke/github-comment)
* [ci-info](https://github.com/suzuki-shunsuke/ci-info)
* [aqua](https://aquaproj.github.io/)

## Example

```yaml
- uses: suzuki-shunsuke/tfaction/setup@main
  with:
    target: github/foo
    github_app_token: ${{ secrets.GITHUB_APP_TOKEN }}
```

## Inputs

### Required Inputs

name | type | description
--- | --- | ---
github_app_token | string | GitHub Access Token. `github.token` can't be used because it can't invoke GitHub Actions Workflow

### Optional Inputs

name | type | default | description
--- | --- | --- | ---
github_token | string | `github.token` | GitHub Access Token
ssh_key | string | '' | SSH Private Key

## Outputs

name | type | description
--- | --- | ---
working_directory | file path | Working Directory
s3_bucket_name_plan_file | S3 Bucket Name | S3 Bucket Name for Terraform Plan files
s3_bucket_name_tfmigrate_history | S3 Bucket Name | S3 Bucket Name for tfmigrate history files
