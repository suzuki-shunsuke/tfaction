tfmigrate {
  migration_dir = "./tfmigrate"
  history {
    storage "s3" {
      bucket = "{{s3_bucket_name_tfmigrate_history}}"
      key    = "{{target}}/history.json"
    }
  }
}
