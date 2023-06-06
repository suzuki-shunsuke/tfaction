#!/usr/bin/env bash

set -eu
set -o pipefail

if [ -n "${S3_BUCKET_NAME_PLAN_FILE:-}" ]; then
	github-comment exec -- aws s3 cp tfplan.binary "s3://$S3_BUCKET_NAME_PLAN_FILE/$PR_NUMBER/$TFACTION_TARGET/tfplan.binary"
fi
if [ -n "${GCS_BUCKET_NAME_PLAN_FILE:-}" ]; then
	github-comment exec -- gsutil cp tfplan.binary "gs://$GCS_BUCKET_NAME_PLAN_FILE/$PR_NUMBER/$TFACTION_TARGET/tfplan.binary"
fi
