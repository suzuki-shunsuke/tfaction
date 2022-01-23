# scaffold-working-dir

## Requirements

* [aqua](https://aquaproj.github.io/)

## Example

```yaml
- uses: suzuki-shunsuke/tfaction/scaffold-working-dir@main
```

## Placeholders

The following placeholders in templates are replaced.

* `%%TARGET%%`: target
* `%%S3_BUCKET_NAME_TFMIGRATE_HISTORY%%`: S3 Bucket Name for tfmigrate history files

e.g.

```tf
terraform {
  required_version = ">= 1.0"
  backend "s3" {
    bucket = "<S3 Bucket Name>"
    key    = "%%TARGET%%/v1/terraform.tfstate" # Placeholder
    region = "us-east-1"
  }
}
```

## Environment variables

* TFACTION_TARGET (required)
* TFACTION_CONFIG (optional)

## Inputs

Nothing.

## Outputs

name | type | description
--- | --- | ---
working_directory | file path | Working Directory
