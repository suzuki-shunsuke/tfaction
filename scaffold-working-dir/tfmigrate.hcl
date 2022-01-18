tfmigrate {
  migration_dir = "./tfmigrate"
  history {
    storage "s3" {
      bucket = "%%S3_BUCKET_NAME_TFMIGRATE_HISTORY%%"
      key    = "%%TARGET%%/history.json"
    }
  }
}
