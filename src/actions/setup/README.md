# setup

Action to run at the beginning of plan and apply jobs.

## Exported environment variables

- `AQUA_GLOBAL_CONFIG`
- `TFACTION_WORKING_DIR`
- `TFACTION_TARGET`
- Environment variables configured in `tfaction-root.yaml` and `tfaction.yaml`

## Outputs

- `working_directory`
- `providers_lock_opts`
- `enable_tflint`
- `enable_trivy`
- `tflint_fix`
- `terraform_command`
- `template_dir`
- `aws_region`
- `aws_assume_role_arn`
- `aws_role_session_name`
- `gcp_service_account`
- `gcp_workload_identity_provider`
- `gcp_access_token_scopes`
- `gcp_remote_backend_service_account`
- `gcp_remote_backend_workload_identity_provider`
- `s3_bucket_name_tfmigrate_history`
- `gcs_bucket_name_tfmigrate_history`
- `destroy`
- `enable_terraform_docs`
- `accept_change_by_renovate`

## Steps

1. Run ci-info to get PR information. Export as environment variables and write to temporary files
2. Fail if the SHA running the workflow is not the latest head SHA of the PR
3. If the PR branch is outdated, update the branch
4. Add the root module label to the PR
5. Export settings as environment variables and outputs
6. Aggregate secrets into JSON and output
7. If configured, update `aqua-checksums.json`
