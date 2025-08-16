---
sidebar_position: 500
---

# Set Terraform CLI options with the environment variable

[#311](https://github.com/suzuki-shunsuke/tfaction/issues/311)

Some actions don't provide inputs to set Terraform CLI options, but you can set them with Terraform's environment variable `TF_CLI_ARGS` and `TF_CLI_ARGS_name`.

https://www.terraform.io/cli/config/environment-variables#tf_cli_args-and-tf_cli_args_name

e.g.

```yaml
- uses: suzuki-shunsuke/tfaction/terraform-plan@main
  with:
    github_app_token: ${{ secrets.GITHUB_APP_TOKEN }}
  env:
    TF_CLI_ARGS_plan: "-parallelism=30"
```
