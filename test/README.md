# test

## Requirements

* [tfmigrate](https://github.com/minamijoyo/tfmigrate)
* AWS CLI
* [ghcp](https://github.com/int128/ghcp)
* [github-comment](https://github.com/suzuki-shunsuke/github-comment)
* [ci-info](https://github.com/suzuki-shunsuke/ci-info)
* [tfenv](https://github.com/tfutils/tfenv)
* [tflint](https://github.com/aquasecurity/tfsec)

## Example

```yaml
- uses: suzuki-shunsuke/tfaction/test@main
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
target | string | '' | target
working_directory | string | '' | working directory
github_token | string | `github.token` | GitHub Access Token
