tfmigrate {
  migration_dir = "./tfmigrate"
  history {
    storage "gcs" {
      bucket = "{{gcs_bucket_name_tfmigrate_history}}"
      name   = "{{target}}/history.json"
    }
  }
}
