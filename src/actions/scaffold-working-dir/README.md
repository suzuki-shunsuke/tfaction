# scaffold-working-dir

Creates a new root module based on a template.
This action only handles code generation.
Run `create-scaffold-pr` after this action to create a PR.

## Environment variables

- `TFACTION_TARGET`
- `TFACTION_WORKING_DIR`

## Details

If `s3_bucket_name_tfmigrate_history` or `gcs_bucket_name_tfmigrate_history` is configured, generates a `.tfmigrate.hcl` file.
Template files are processed with Handlebars.
