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
    github_app_token: ${{ secrets.GITHUB_APP_TOKEN }}
```

## Inputs

### Required Inputs

name | description
--- | ---
github_app_token | GitHub Access Token. `github.token` can't be used because it can't invoke GitHub Actions Workflow

### Optional Inputs

name | environment variable | default | description
--- | --- | ---
github_token | | `github.token` | GitHub Access Token

## Outputs

Nothing.
