---
sidebar_position: 450
---

# Manage Terraform Modules

_tfaction's required version: `>= v0.5.0` [#221](https://github.com/suzuki-shunsuke/tfaction/issues/221)_

tfaction supports scaffolding, testing, and releasing Terraform Modules.

Please add a file `tfaction_module.yaml` in the Module directory.
tfaction detects Modules with this file.
Currently, tfaction doesn't read the content, so there is no problem even if the content is empty.

```yaml
{}
```

## Scaffold Module

:bulb: If you don't want to create pull requests by GitHub App, please see [Support skipping creating pull requests](skip-creating-pr.md).

You can scaffold a new Terraform Module by GitHub Actions.

1. Prepare templates of Terraform Modules

[example](https://github.com/suzuki-shunsuke/tfaction-example/tree/example-v1-2/templates/module-hello)

2. Set up the workflow

- [example](https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/scaffold-module.yaml)
- [action](https://github.com/suzuki-shunsuke/tfaction/blob/main/scaffold-module/action.yaml)

3. Execute the workflow

![image](https://user-images.githubusercontent.com/13323303/156072535-e9d65c62-23b8-48a1-9827-f9fce4ea191c.png)

--

![image](https://user-images.githubusercontent.com/13323303/156072431-56345976-60ba-4874-afcd-37026ec0510a.png)

## Test Module

- [example](https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/wc-test-module.yaml)
- [action](https://github.com/suzuki-shunsuke/tfaction/blob/main/test-module/action.yaml)

### Generate Document

The action [test-module](https://github.com/suzuki-shunsuke/tfaction/blob/main/test-module/action.yaml) generates the document by [terraform-docs](https://github.com/terraform-docs/terraform-docs).

If `README.md` is generated or updated, a commit is pushed to the feature branch `$GITHUB_HEAD_REF`.

![image](https://user-images.githubusercontent.com/13323303/156068791-96406162-e42c-4197-aa9c-40bd457af941.png)

--

![image](https://user-images.githubusercontent.com/13323303/156068986-5df71e03-c662-4735-aae8-5acf061d595b.png)

## Release Module

Instead of [Local paths](https://www.terraform.io/language/modules/sources#local-paths) Source, we recommend creating a tag and fix the version by [GitHub](https://www.terraform.io/language/modules/sources#github) Source.

1. Set up the workflow

- [Example workflow](https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/release-module.yaml)
- [action](https://github.com/suzuki-shunsuke/tfaction/blob/main/release-module/action.yaml)

2. Release a new version by executing the workflow

![image](https://user-images.githubusercontent.com/13323303/156072006-12d48ac2-95ee-41ab-a90a-42b232f40140.png)

--

![image](https://user-images.githubusercontent.com/13323303/156072085-cabd76cd-e8a4-44af-b407-e862f4bf9946.png)

3. Use the Module

```hcl
module "foo" {
  source = "github.com/${GitHub Repository full name}//${module path}?ref=${GitHub tag name}"
}
```

## :bulb: Trouble shooting about downloading Private Modules

If it fails to download Private Modules in `terraform init`, you may have to run [gh auth setup-git](https://cli.github.com/manual/gh_auth_setup-git) with GitHub Access Token.

Error of `terraform init`

```
Upgrading modules...
Downloading git::https://github.com/***/***.git?ref=*** for ***...
╷
│ Error: Failed to download module
│
│ Could not download module "***" (main.tf:1) source code
│ from
│ "git::https://github.com/***/***.git?ref=***":
│ error downloading
│ 'https://github.com/***/***.git?ref=***':
│ /usr/bin/git exited with 128: Cloning into
│ '.terraform/modules/***'...
│ fatal: could not read Username for 'https://github.com': No such device or
│ address
│
╵
```

GitHub Actions Workflow

```yaml
# This is required to download private modules in `terraform init`
- run: gh auth setup-git
  env:
    GITHUB_TOKEN: ${{ steps.generate_token.outputs.token }}

- uses: suzuki-shunsuke/tfaction/setup@v0.5.0
  with:
    github_app_token: ${{ steps.generate_token.outputs.token }}
```
