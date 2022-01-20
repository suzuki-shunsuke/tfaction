# tfmigrate

About tfmigrate, please see https://github.com/minamijoyo/tfmigrate .

You can introduce tfmigrate to Terraform Workflow easily with tfaction.

1. Create .tfmigrate.hcl and migration file in the working directory
1. Create a Pull Request with label `tfmigrate:<target>`

`tfmigrate plan` is run in the pull request CI, and `tfmigrate apply` is run in the main branch.

The label prefix `tfmigrate:` can be changed in the configuration file [tfaction-root.yaml](config.md).

```yaml
label_prefixes:
  tfmigrate: "migrate:"
  ignore: "ignore:"
```

`tfmigrate plan` is run.

![image](https://user-images.githubusercontent.com/13323303/150029520-fd3aac78-d76a-41ee-9df0-a7fc02fb12b7.png)

`tfmigrate apply` is run.

![image](https://user-images.githubusercontent.com/13323303/150029697-316218e0-cb1e-4a8d-ad5c-0c12e1cb68dc.png)

## multi_state migration

If you migrate resources from the target `A` to the target `B` using [tfmigrate's multi_state](https://github.com/minamijoyo/tfmigrate#multi_state-mv).

1. Create .tfmigrate.hcl and migration file in the working directory `A`
1. Create a Pull Request with label `tfmigrate:<target A>` and `ignore:<target B>`

Or

1. Create .tfmigrate.hcl and migration file in the working directory `B`
1. Create a Pull Request with label `tfmigrate:<target B>` and `ignore:<target A>`

The label `ignore:<target>` is important to prevent `terraform plan` and `terraform apply` from being run.
