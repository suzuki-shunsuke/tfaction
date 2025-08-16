---
sidebar_position: 400
---

# tfmigrate

About tfmigrate, please see https://github.com/minamijoyo/tfmigrate .

You can introduce tfmigrate to Terraform Workflow easily with tfaction.

1. Create .tfmigrate.hcl and migration file in the working directory
1. Create a Pull Request with label `tfmigrate:<target>`

`tfmigrate plan` is run in the pull request CI, and `tfmigrate apply` is run in the main branch.

The label prefix `tfmigrate:` can be changed in the configuration file [tfaction-root.yaml](/config/tfaction-root-yaml).

```yaml
label_prefixes:
  tfmigrate: "migrate:"
  skip: "skip:"
```

`tfmigrate plan` is run.

![image](https://user-images.githubusercontent.com/13323303/150029520-fd3aac78-d76a-41ee-9df0-a7fc02fb12b7.png)

`tfmigrate apply` is run.

![image](https://user-images.githubusercontent.com/13323303/150029697-316218e0-cb1e-4a8d-ad5c-0c12e1cb68dc.png)

## multi_state migration

If you migrate resources from the target `A` to the target `B` using [tfmigrate's multi_state](https://github.com/minamijoyo/tfmigrate#multi_state-mv).

1. Create .tfmigrate.hcl and migration file in the working directory `A`
1. Create a Pull Request with label `tfmigrate:<target A>` and `skip:<target B>`

Or

1. Create .tfmigrate.hcl and migration file in the working directory `B`
1. Create a Pull Request with label `tfmigrate:<target B>` and `skip:<target A>`

The label `skip:<target>` is important to prevent `terraform plan` and `terraform apply` from being run.

## Scaffold migration pull request

It is a little bothersome to write migration file.
You can scaffold migration pull request by GitHub Actions.

[workflow](https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/scaffold-tfmigrate.yaml)

![image](https://user-images.githubusercontent.com/13323303/154389701-737050cf-beca-4754-9852-76986e4ebf21.png)

![image](https://user-images.githubusercontent.com/13323303/154388296-420b421e-1940-446a-a8e1-95d2b4f3f782.png)

### :bulb: Skip creating pull requests

If you don't want to create pull requests by GitHub App, please see [Support skipping creating pull requests](skip-creating-pr.md).
