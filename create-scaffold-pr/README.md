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
    working_directory: github/services/foo
```

## Inputs

### Required Inputs

name | type | description
--- | --- | ---
target | string | target
github_app_token | string | GitHub Access Token. `github.token` can't be used because it can't invoke GitHub Actions Workflow
working_directory | string (file path) | working directory

### Optional Inputs

Nothing.

## Outputs

Nothing.
