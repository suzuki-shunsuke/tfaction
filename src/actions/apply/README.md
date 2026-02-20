# apply

Runs terraform apply or tfmigrate apply.

## Inputs

All inputs are optional.

- `github_token`
- `github_token_for_github_provider`
- `secrets`

## Environment variables

- `TFACTION_JOB_TYPE`
- `TFACTION_SKIP_TERRAFORM`

## Steps

1. If `skip_terraform` is enabled, do nothing
2. Download the plan file from GitHub Artifacts
   - Fails if `plan_workflow_name` is incorrect
3. Run terraform apply and notify via tfcmt
4. If drift detection is enabled, update the drift issue
5. Update branches of other PRs that modify the same root module
