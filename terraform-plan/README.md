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
    github_app_token: ${{ secrets.GITHUB_APP_TOKEN }}
```

## Inputs

### Required Inputs

name | environment variable | description
--- | --- | ---
github_app_token | | GitHub Access Token. `github.token` can't be used because it can't invoke GitHub Actions Workflow

### Optional Inputs

name | environment variable | default | description
--- | --- | --- | ---
github_token | | `github.token` | GitHub Access Token

## Outputs

Nothing.
