---
sidebar_position: 900
---

# Linters

tfaction runs some linters in [test](https://github.com/suzuki-shunsuke/tfaction/blob/main/test/action.yaml) and [test-module](https://github.com/suzuki-shunsuke/tfaction/blob/main/test-module/action.yaml) actions.

- terraform validate
- [suzuki-shunsuke/github-action-tflint](https://github.com/suzuki-shunsuke/github-action-tflint)
- [suzuki-shunsuke/github-action-tfsec](https://github.com/suzuki-shunsuke/github-action-tfsec)
- [suzuki-shunsuke/trivy-config-action](https://github.com/suzuki-shunsuke/trivy-config-action)

## Enable or disable linters

You can enable or disable the following linters

- tflint
- tfsec
- Trivy

You can configure them at `tfaction-root.yaml`.

By default, tflint and tfsec are enabled and Trivy is disabled.

If you want to migrate tfsec to Trivy, please disable tfsec and enable Trivy.

```yaml
tfsec:
  enabled: false
trivy:
  enabled: true
```

You can also disable tflint.

```yaml
tflint:
  enabled: false
```

## tflint

tfaction runs [tflint](https://github.com/terraform-linters/tflint) and notifies the result.

![image](https://user-images.githubusercontent.com/13323303/153742908-2512f73a-1505-4c0c-9284-b6deb8983c2f.png)

--

![image](https://user-images.githubusercontent.com/13323303/153742833-403ea6c5-a780-4d2a-a30c-3a481c0971b1.png)

### Fix code by `tflint --fix`

[#2104](https://github.com/suzuki-shunsuke/tfaction/pull/2104) tfaction >= v1.13.0, tflint >= [v0.47.0](https://github.com/terraform-linters/tflint/releases/tag/v0.47.0)

Codes are fixed by `tflint --fix` and a commit is pushed to the feature branch.

![image](https://storage.googleapis.com/zenn-user-upload/b83113fcc2e0-20241215.png)

By default, this feature is disabled.
You can enable this by tfaction-root.yaml.

```yaml
tflint:
  enabled: true
  fix: true # Enable `tflint --fix`
```

## tfsec

tfaction runs [tfsec](https://github.com/aquasecurity/tfsec) and notifies the result.

![image](https://user-images.githubusercontent.com/13323303/153747798-0e6ac3d4-e335-4c20-8e2a-1f5b43205ff3.png)

--

![mage](https://user-images.githubusercontent.com/13323303/153747838-ccbd4fba-6654-4589-84c8-7ae833644426.png)

## Trivy

![image](https://github.com/suzuki-shunsuke/trivy-config-action/assets/13323303/e4d7f6f7-3df3-44bb-8f98-535173ce096e)

--

![image](https://github.com/suzuki-shunsuke/trivy-config-action/assets/13323303/2d0c6224-8ae4-42f0-80d8-06488ff18f56)
