#!/usr/bin/env bash

set -eu
set -o pipefail

curl -X POST "https://api.github.com/repos/$GITHUB_REPOSITORY/issues/${PR_NUMBER}/labels" \
	-H "Authorization: token ${GITHUB_TOKEN}" \
	-H "Accept: application/json" \
	-H "Content-type: application/json" \
	-d "[{\"name\":\"${TFACTION_TARGET}\"}]"

echo "===> Delete old plan file to prevent the accident" >&2
if aws s3api head-object --bucket "$S3_BUCKET_NAME_PLAN_FILE" --key "$PR_NUMBER/$TFACTION_TARGET/tfplan.binary"; then
	github-comment exec -- aws s3 delete "s3://$S3_BUCKET_NAME_PLAN_FILE/$PR_NUMBER/$TFACTION_TARGET/tfplan.binary"
fi

if [ ! -f .tfmigrate.hcl ]; then
	sed "s|%%TARGET%%|$TFACTION_TARGET|g" \
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
