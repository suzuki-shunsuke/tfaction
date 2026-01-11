---
sidebar_position: 600
---

# Conftest

:::info
Conftest support was improved at tfaction [v1.8.0](https://github.com/suzuki-shunsuke/tfaction/releases/tag/v1.8.0).
:::

About Conftest, please see https://www.conftest.dev/ .

https://www.openpolicyagent.org/docs/latest/terraform/

tfaction supports validating files using Conftest.
Any violation is notified as pull request comment.

![image](https://user-images.githubusercontent.com/13323303/150035710-249c4cbd-47fa-46d7-ae0d-28ab4ace1a64.png)

tfaction doesn't provide any Conftest Policy. Please write your Conftest Policy freely.

We recommend writing the document about Conftest Policy per policy.

```
policy/
  github_issue_label_description.rego # Policy
  github_issue_label_description_test.rego # Policy Test
  github_issue_label_description.md # Policy Document
```

![image](https://user-images.githubusercontent.com/13323303/150035773-1702fba7-5058-412f-b41c-f69793237dd7.png)

## Settings

### conftest

tfaction >= [v1.8.0](https://github.com/suzuki-shunsuke/tfaction/releases/tag/v1.8.0):

You can configure policies at three layers.

1. tfaction.yaml
1. target_group in tfaction-root.yaml
1. root in tfaction-root.yaml

tfaction-root.yaml:

```yaml
conftest:
  policies:
    - policy: policy/plan
      plan: true
      id: plan
target_groups:
  - working_directory: aws/
    # ...
    conftest:
      disable_all: true
      # ...
```

tfaction.yaml:

```yaml
conftest:
  policies:
    - id: plan
      enabled: false
    - policy: policy/combine/tf
      tf: true
      combine: true
      data: data
```

Basically, tfaction joins `conftest.policies` and runs `conftest test` by policy.
Using `id` field, you can also overwrite the existing policy.

`conftest`:

- `disable_all`: Boolean. If this is true, settings in previous layers are disabled
- `policies`: A list of policies

`conftest.policies[]`:

- tfaction specific options:
  - `id`: unique id of policy. This is optional. This is used to overwrite the setting
  - `plan`: boolean. Whether this policy is for plan files. The default is `false`
  - `tf`: boolean. Whether this policy is for `*.tf` and `*.tf.json`. The default is `false`
  - `enabled`: boolean. Whether this policy is enabled. The default is `true`
- conftest options:
  - `policy`: A list or a string of relative paths to a policy directory from the repository root directory
  - `data`: A list or a string of conftest test's `-data` option. A relative path to a data directory from the repository root directory
  - `combine`: boolean. conftest test's `-combine` option. The default is `false`
  - `fail_on_warn`: boolean. conftest test's `-fail-on-warn` option. The default is `false`
  - `no_fail`: boolean. conftest test's `-no-fail` option. The default is `false`
  - `all_namespaces`: boolean. conftest test's `-all-namespaces` option. The default is `false`
  - `quiet`: boolean. conftest test's `-quiet` option. The default is `false`
  - `trace`: boolean. conftest test's `-trace` option. The default is `false`
  - `strict`: boolean. conftest test's `-strict` option. The default is `false`
  - `show_builtin_errors`: boolean. conftest test's `-show-builtin-errors` option. The default is `false`
  - `junit_hide_message`: boolean. conftest test's `-junit-hide-message` option. The default is `false`
  - `suppress_exceptions`: boolean. conftest test's `-suppress-exceptions` option. The default is `false`
  - `tls`: boolean. conftest test's `-tls` option. The default is `false`
  - `parser`: string. conftest test's `-parser` option
  - `output`: string. conftest test's `-output` option
  - `namespaces`: A list of strings. conftest test's `-namespace` option
- `paths`: A list of tested file paths. [glob](https://www.npmjs.com/package/glob) is available.

```yaml
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

## Refer `target` and `working_directory` in policies by `-data` option

[v1.10.0](https://github.com/suzuki-shunsuke/tfaction/releases/tag/v1.9.0) [#1914](https://github.com/suzuki-shunsuke/tfaction/pull/1914)

tfaction creates a special data file temporarily and pass it to your policies by [--data option](https://www.conftest.dev/options/#-data).
The data file includes `target` and `working_directory`, so you can refer them in policies.

e.g.

```rego
import data.tfaction

target := tfaction.target
working_directory := tfaction.working_directory
```

## Example

```yaml
conftest:
  policies:
    - policy: policy/tf
      id: tf
      tf: true
    - policy: policy/combine/tf
      combine: true
      tf: true
    - policy: policy/plan
      plan: true
    - policy: policy/tfaction
      paths:
        - tfaction.yaml
    - policy: policy/json
      paths:
        - "*.json"
```

`disable_all`:

```yaml
conftest:
  disable_all: true # Disable settings of previous layers
  policies:
    - policy: policy/tf
      tf: true
```

`enabled: false`: Disable specific policies.

```yaml
conftest:
  policies:
    - id: tf
      enabled: false
    - policy: policy/plan
      plan: true
```
