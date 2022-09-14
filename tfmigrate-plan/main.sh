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

if [ ! -f .tfmigrate.hcl ]; then
	if [ -n "${S3_BUCKET_NAME_TFMIGRATE_HISTORY:-}" ]; then
		sed "s|%%TARGET%%|$TFACTION_TARGET|g" \
			"$GITHUB_ACTION_PATH/tfmigrate.hcl" |
			sed "s|%%S3_BUCKET_NAME_TFMIGRATE_HISTORY%%|$S3_BUCKET_NAME_TFMIGRATE_HISTORY|g" >.tfmigrate.hcl
	elif [ -n "${GCS_BUCKET_NAME_TFMIGRATE_HISTORY:-}" ]; then
		sed "s|%%TARGET%%|$TFACTION_TARGET|g" \
			"$GITHUB_ACTION_PATH/tfmigrate-gcs.hcl" |
			sed "s|%%GCS_BUCKET_NAME_TFMIGRATE_HISTORY%%|$GCS_BUCKET_NAME_TFMIGRATE_HISTORY|g" >.tfmigrate.hcl
	else
		github-comment post \
			--config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
			-k tfmigrate-hcl-not-found -var "tfaction_target:$TFACTION_TARGET"
		exit 1
	fi
	github-comment exec \
		--config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
		-- \
		ghcp commit -r "$GITHUB_REPOSITORY" -b "$GITHUB_HEAD_REF" \
		-m "chore(tfmigrate): add .tfmigrate.hcl" \
		-C "$ROOT_DIR" "$WORKING_DIR/.tfmigrate.hcl" \
		--token "$GITHUB_APP_TOKEN"
	exit 1
fi

github-comment exec \
	--config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
	-k tfmigrate-plan \
	-var "tfaction_target:$TFACTION_TARGET" \
	-- tfmigrate plan --out tfplan.binary

if [ -d "$ROOT_DIR/policy" ]; then
	github-comment exec -- terraform show -json tfplan.binary >tfplan.json
	conftest -v # Install conftest in advance to exclude aqua lazy install log from github-comment's comment
	github-comment exec \
		--config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
		-var "tfaction_target:$TFACTION_TARGET" \
		-k conftest -- \
			conftest test --no-color -p "$ROOT_DIR/policy" tfplan.json
fi
