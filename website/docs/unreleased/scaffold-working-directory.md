---
sidebar_position: 1000
---

# Creating a Root Module from a Template

Let's add a GitHub Actions workflow to create a root module from a template.

1. Add a workflow

```yaml:.github/workflows/scaffold_working_directory.yaml
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
    runs-on: ubuntu-24.04
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1
        with:
          persist-credentials: false

      - uses: suzuki-shunsuke/tfaction@latest
        id: scaffold-working-dir
        with:
          action: scaffold-working-dir

      - name: Create GitHub App installation access token
        uses: actions/create-github-app-token@29824e69f54612133e76f7eaac726eef6c875baf # v2.2.1
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

2. Add a template as well.

```
templates/hello
  tfaction.yaml
  main.tf
  # ...
```

3. Specify the template to use for each target group in tfaction-root.yaml.

```yaml:tfaction-root.yaml
target_groups:
  - working_directory: ""
    template_dir: templates/hello
```

That completes the setup. When you run the workflow specifying a working directory, a PR will be created.

## Template Engine

Files in the template are processed with [Handlebars](https://handlebarsjs.com/).
The following variables are available.

- ``

## Running the Workflow

Run the workflow to create a PR.
