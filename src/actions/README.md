# Actions

tfaction is a single action that provides various features through the `action` input.
This document describes common inputs and environment variables shared across multiple actions.

## Common inputs and environment variables

### Inputs

- `github_token`: GitHub Access Token used for generating comments on PRs, etc.
- `github_token_for_github_provider`: GitHub Access Token used for the GitHub Provider. Not required if you don't use the GitHub Provider.
- `secrets`: JSON of environment variable names and values that are set when running commands like terraform init, plan, and apply. Used to pass secrets required for command execution.

### Environment variables

- `TFACTION_JOB_TYPE`: One of `terraform` | `tfmigrate` | `scaffold_working_dir`. Used to change the behavior of actions.
  - `terraform`: Runs terraform plan or apply
  - `tfmigrate`: Runs tfmigrate plan or apply
- `TFACTION_SKIP_TERRAFORM`
