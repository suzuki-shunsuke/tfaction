---
sidebar_position: 1700
---

# Configuring Terraform Command Options

To set options for terraform commands in tfaction, you can use the environment variables `TF_CLI_ARGS` and `TF_CLI_ARGS_name`.
This is a Terraform feature, not a tfaction feature.

https://www.terraform.io/cli/config/environment-variables#tf_cli_args-and-tf_cli_args_name

e.g.

```yaml
- uses: suzuki-shunsuke/tfaction@latest
  with:
    action: plan
  env:
    TF_CLI_ARGS_plan: "-parallelism=30"
```
