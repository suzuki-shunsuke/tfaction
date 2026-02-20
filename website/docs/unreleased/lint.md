---
sidebar_position: 900
---

# Linting and Formatting

You can perform linting and formatting using the `test` action.

- terraform fmt
- terraform validate
- Optional
  - tflint
  - trivy
  - conftest

Run it after `terraform-init` and before `plan`.

```yaml
- name: terraform init
  uses: suzuki-shunsuke/tfaction@latest
  with:
    action: terraform-init
    github_token: ${{ steps.token.outputs.token }}

- name: Lint
  uses: suzuki-shunsuke/tfaction@latest
  with:
    action: test
    github_token: ${{ steps.token.outputs.token }}

- name: Plan
  uses: suzuki-shunsuke/tfaction@latest
  with:
    action: plan
    github_token: ${{ steps.token.outputs.token }}
```

For now, let's disable tflint and trivy.

```yaml:tfaction-root.yaml
tflint:
  enabled: false
trivy:
  enabled: false
```

This enables validation with terraform validate and automatic formatting with terraform fmt.

## terraform fmt

If the code is not formatted, terraform fmt will format it and automatically push a commit.

![terraform fmt](https://storage.googleapis.com/zenn-user-upload/a54a142fb196-20260208.png)

## terraform-docs

[terraform-docs](https://terraform-docs.io/) is disabled by default, so let's enable it.

```yaml:tfaction-root.yaml
terraform_docs:
  enabled: true
```

Documentation is automatically generated and updated.
tfaction installs terraform-docs automatically.

![](https://storage.googleapis.com/zenn-user-upload/80fbdc39621f-20260208.png)

terraform-docs works without configuration, but if you want to write a configuration file, create it at one of the following paths (listed in order of priority):

1. `.terraform-docs.ya?ml` in the root module
1. `.config/.terraform-docs.ya?ml` in the root module
1. `.terraform-docs.ya?ml` in the repository root
1. `.config/.terraform-docs.ya?ml` in the repository root

## tflint

[tflint](https://github.com/terraform-linters/tflint) is enabled by default, but you can also explicitly enable it in the configuration.

```yaml:tfaction-root.yaml
tflint:
  enabled: true
```

You need to install tflint.
Let's add it to aqua.yaml.

```sh
aqua g -i terraform-linters/tflint
```

```yaml:aqua.yaml
packages:
  - name: terraform-linters/tflint@v0.61.0
```

tflint performs linting and reviewdog creates reviews.

![](https://storage.googleapis.com/zenn-user-upload/49d868efb665-20260208.png)

Automatic fixes with tflint --fix are also supported.
This is enabled by default, but can be disabled.

```yaml
tflint:
  fix: false
```

[Refer to tflint's official documentation for configuration file details.](https://github.com/terraform-linters/tflint/blob/master/docs/user-guide/config.md)
If you want to share a common configuration file, create one in the repository root and set the `TFLINT_CONFIG_FILE` environment variable.

```yaml
env:
  TFLINT_CONFIG_FILE: ${{github.workspace}}/.tflint.hcl
```

## trivy

[trivy](https://trivy.dev/) is enabled by default, but you can also explicitly enable it in the configuration.

```yaml:tfaction-root.yaml
trivy:
  enabled: true
```

You need to install trivy.
Let's add it to aqua.yaml.

```sh
aqua g -i aquasecurity/trivy
```

```yaml:aqua.yaml
packages:
  - name: aquasecurity/trivy@v0.69.1
```

trivy performs linting and reviewdog creates reviews.

### reviewdog

trivy and tflint results are reflected in PRs through reviewdog.
You can configure reviewdog's command-line options.

```yaml:tfaction-root.yaml
tflint:
  reviewdog:
    filter_mode: added # Default is nofilter
    fail_level: error # Default is any
trivy:
  reviewdog:
    filter_mode: added # Default is nofilter
    fail_level: error # Default is any
```

The important setting is `filter_mode`.
The default is `nofilter`, which targets all files in the root module.
On the other hand, `added` targets only changed files.
Which is better depends on your situation.
If you want to strictly enforce policies, `nofilter` is appropriate.
However, it is often difficult to retroactively apply policies to existing code.
In that case, it may be more practical to give up on applying policies to existing code and use `added` to apply policies only to new code.

## conftest

[conftest](https://www.conftest.dev/) is executed in the test and plan actions.
In test, it runs against HCL; in plan, it runs against plan files.
Usually, running against plan files is preferable.

- You can apply policies based on plan results (create, update, destroy)
  - For example, you can apply policies only to new resources or apply policies on destroy
- You can apply policies based on terraform's computed results

On the other hand, there are cases where running against HCL is better.

- Settings like backend configuration are not included in plan files, so policies can only be applied against HCL
- Since terraform plan carries risks such as arbitrary code execution and credential exfiltration, you can apply policies against HCL before running terraform plan to check for dangerous code

https://zenn.dev/shunsuke_suzuki/scraps/53d7f5e954f90d

To run against HCL, specify `tf: true`.
To run against plan files, specify `plan: true`.
If neither is specified, conftest can also run against non-Terraform files such as YAML or Dockerfiles.

```yaml:tfaction-root.yaml
conftest:
  policies:
    - policy: policy/tf
      tf: true
      id: tf
    - policy: policy/plan
      plan: true
      id: plan
    - policy: policy/yaml
      paths:
        - "*.yml"
        - "*.yaml"
```

`.conftest.policies[]` supports many options of the `conftest test` command.

```yaml:tfaction-root.yaml
conftest:
  policies:
    - policy: # array or string
        - policy/terraform
      data: # array or string
        - data/data.yaml
      fail_on_warn: true
      no_fail: true
      all_namespaces: true
      quiet: true
      trace: true
      strict: true
      show_builtin_errors: true
      junit_hide_message: true
      suppress_exceptions: true
      tls: true
      parser: hcl
      output: json
      namespaces:
        - main
```

In addition, there are several tfaction-specific settings.

- id: Optional. An ID to identify the policy. Required when you want to override a policy.
- plan: Set to true to run against plan files. Default is false.
- tf: Set to true to run against _.tf and _.tf.json files. Default is false.
- enabled: Default is true. Useful when you want to override and disable a setting.
