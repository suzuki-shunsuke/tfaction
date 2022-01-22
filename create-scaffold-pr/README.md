# create-scaffold-pr

## Requirements

* [aqua](https://aquaproj.github.io/)
* [ghcp](https://github.com/int128/ghcp)

## Example

```yaml
- uses: suzuki-shunsuke/tfaction/create-scaffold-pr@main
  with:
    target: github/foo
    github_app_token: ${{ secrets.GITHUB_APP_TOKEN }}
```

## Inputs

### Environment variables

* TFACTION_TARGET
* TFACTION_CONFIG

### Required Inputs

name | type | description
--- | --- | ---
github_app_token | string | GitHub Access Token. `github.token` can't be used because it can't invoke GitHub Actions Workflow

### Optional Inputs

Nothing.

## Outputs

Nothing.
