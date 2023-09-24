#!/usr/bin/env bash

set -eu
set -o pipefail

echo "===> Delete old plan files" >&2
if [ -n "${S3_BUCKET_NAME_PLAN_FILE:-}" ]; then
	aws s3 rm --recursive "s3://$S3_BUCKET_NAME_PLAN_FILE/$PR_NUMBER/$TFACTION_TARGET" || :
fi
if [ -n "${GCS_BUCKET_NAME_PLAN_FILE:-}" ]; then
	gsutil rm -r "gs://$GCS_BUCKET_NAME_PLAN_FILE/$PR_NUMBER/$TFACTION_TARGET" || :
fi
