---
sidebar_position: 1200
---

# Scaffolding Root Modules and Modules from Templates

Add a GitHub Actions workflow to create root modules or modules from templates.

1. Add the workflow

```yaml
name: Scaffold a working directory
run-name: Scaffold a working directory (${{inputs.working_dir}})
on:
  workflow_dispatch:
    inputs:
      working_dir:
        description: working directory
        required: true
env:
  TFACTION_WORKING_DIR: ${{github.event.inputs.working_dir}}
jobs:
  scaffold:
    timeout-minutes: 10
    runs-on: ubuntu-26.04
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false

      - uses: suzuki-shunsuke/tfaction@latest
        id: scaffold-working-dir
        with:
          action: scaffold-working-dir

      - name: Create GitHub App installation access token
        uses: actions/create-github-app-token@64ab729a6294000f5aa4a4bc0b73d1f32bc45510 # v3.3.0
        id: token
        with:
          app-id: ${{ vars.APP_ID }}
          private-key: ${{ secrets.PRIVATE_KEY }}
          permission-contents: write
          permission-pull-requests: write

      - uses: suzuki-shunsuke/tfaction@latest
        with:
          action: create-scaffold-pr
          github_token: ${{steps.token.outputs.token}}
```

1. Add your templates

```
templates/hello
  tfaction.yaml
  main.tf
  # ...
```

1. Specify the template for each target group in `tfaction-root.yaml`

```yaml
target_groups:
  - working_directory: ""
    template_dir: templates/hello
```

That is all the setup needed. Specify a working directory and run the workflow, and a PR will be created.

## Template Engine

Files within the template are processed with [Handlebars](https://handlebarsjs.com/).

```
{{ working_directory }}
```

The following variables are available.

For root modules:

- `s3_bucket_name_for_tfmigrate_history`
- `gcs_bucket_name_for_tfmigrate_history`
- `working_directory`
- `target`

For modules:

- `module_name`: The module name (directory name)
- `working_directory`
- `github_repository`
- `ref`: `module_${targetConfig.working_directory.replace(/\//g, "_")}_v0.1.0`
