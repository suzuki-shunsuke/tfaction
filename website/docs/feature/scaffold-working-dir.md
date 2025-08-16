---
sidebar_position: 350
description: Scaffold working directory by workflow_dispatch
---

# Scaffold working directory

When you add a new working directory, you can scaffold the directory by GitHub Actions.
tfaction provides a workflow for it.

1. Prepare template directories to scaffold working directories.

[example](https://github.com/suzuki-shunsuke/tfaction-example/tree/main/templates/github)

2. Configure `tfaction-root.yaml`'s `target_groups` to use the template.

[example](https://github.com/suzuki-shunsuke/tfaction-example/blob/4aa980bd9ab572c0bc9244d54eac5215d81ed754/tfaction-root.yaml#L36)

```yaml
target_groups:
  - template_dir: templates/github
    # ...
```

3. Set up the workflow

[example](https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/scaffold-working-directory.yaml)

4. Execute GitHub Actions Workflow manually.

![image](https://user-images.githubusercontent.com/13323303/150027710-19ce0659-4a7a-490d-ad7b-bf77e409099f.png)

Then a pull request would be created.

![image](https://user-images.githubusercontent.com/13323303/151699745-b8743536-7e54-41e1-8f8e-73fdf296fef4.png)

Compared with executing commands at the localhost, GitHub Actions has the following merits.

- GitHub Actions doesn't depend on you local environment
  - You don't have to install tools at local
  - You can avoid the trouble due to the difference of local environment
  - GitHub Actions log is useful for trouble shooting

## Placeholders

The following placeholders in templates are replaced.

- `%%TARGET%%`: target
- `%%S3_BUCKET_NAME_TFMIGRATE_HISTORY%%`: S3 Bucket Name for tfmigrate history files
- `%%GCS_BUCKET_NAME_TFMIGRATE_HISTORY%%`: GCS Bucket Name for tfmigrate history files

e.g.

```tf
terraform {
  required_version = ">= 1.0"
  backend "s3" {
    bucket = "S3 Bucket Name"
    key    = "%%TARGET%%/v1/terraform.tfstate" # Placeholder
    region = "us-east-1"
  }
}
```

## :bulb: Skip creating pull requests

If you don't want to create pull requests by GitHub App, please see [Support skipping creating pull requests](skip-creating-pr.md).

## :bulb: Skip creating aqua.yaml and adding packages

tfaction >= v0.5.25

[#910](https://github.com/suzuki-shunsuke/tfaction/pull/910)

By default scaffold-working-directory creates `aqua.yaml` and add some packages.

```sh
aqua init
aqua g -i open-policy-agent/conftest terraform-linters/tflint aquasecurity/tfsec hashicorp/terraform
```

You can skip this.

tfaction-root.yaml

```yaml
scaffold_working_directory:
  skip_adding_aqua_packages: true
```

By skipping this, you can configure packages and their versions in your template or you can also manage them in repository root's aqua.yaml.
