#!/usr/bin/env bash

set -eu
set -o pipefail

echo "===> Delete old plan file to prevent the accident" >&2
if [ -n "${S3_BUCKET_NAME_PLAN_FILE:-}" ]; then
	aws s3 rm "s3://$S3_BUCKET_NAME_PLAN_FILE/$PR_NUMBER/$TFACTION_TARGET/tfplan.binary" || :
fi
if [ -n "${GCS_BUCKET_NAME_PLAN_FILE:-}" ]; then
	gsutil rm "gs://$GCS_BUCKET_NAME_PLAN_FILE/$PR_NUMBER/$TFACTION_TARGET/tfplan.binary" || :
fi
