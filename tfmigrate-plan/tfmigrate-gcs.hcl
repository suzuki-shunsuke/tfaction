tfmigrate {
  migration_dir = "./tfmigrate"
  history {
    storage "gcs" {
      bucket = "%%GCS_BUCKET_NAME_TFMIGRATE_HISTORY%%"
      name   = "%%TARGET%%/history.json"
    }
  }
}
