#!/usr/bin/env bash

set -eu
set -o pipefail

echo "===> Delete old plan file to prevent the accident" >&2
if aws s3api head-object --bucket "$S3_BUCKET_NAME_PLAN_FILE" --key "$PR_NUMBER/$TARGET/tfplan.binary"; then
	github-comment exec -- aws s3 delete "s3://$S3_BUCKET_NAME_PLAN_FILE/$PR_NUMBER/$TARGET/tfplan.binary"
fi

if [ ! -f .tfmigrate.hcl ]; then
	sed "s|%%TARGET%%|$TARGET|g" \
		"$ROOT_DIR/.github/actions/tfmigrate-plan/tfmigrate.hcl" |
		sed "s|%%S3_BUCKET_NAME_TFMIGRATE_HISTORY%%|$S3_BUCKET_NAME_TFMIGRATE_HISTORY|g" >.tfmigrate.hcl
	github-comment exec -- \
		ghcp commit -r "$GITHUB_REPOSITORY" -b "$GITHUB_HEAD_REF" \
		-m "chore(tfmigrate): add .tfmigrate.hcl" \
		-C "$ROOT_DIR" "$WORKING_DIR/.tfmigrate.hcl" \
		--token "$GITHUB_APP_TOKEN"
	exit 1
fi

github-comment exec -k tfmigrate-plan -- tfmigrate plan
