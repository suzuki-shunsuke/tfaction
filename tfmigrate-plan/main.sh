#!/usr/bin/env bash

set -euo pipefail

if [ "${TFACTION_DEBUG:-}" = true ]; then
	set -x
fi

if [ -z "${TFMIGRATE_EXEC_PATH:-}" ] && [ "$TF_COMMAND" != terraform ]; then
	TFMIGRATE_EXEC_PATH=$TF_COMMAND
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
		-C "$ROOT_DIR" "$WORKING_DIR/.tfmigrate.hcl"
	exit 1
fi

github-comment exec \
	--config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
	-k tfmigrate-plan \
	-var "tfaction_target:$TFACTION_TARGET" \
	-- tfmigrate plan --out tfplan.binary

github-comment exec -- "$TF_COMMAND" show -json tfplan.binary >tfplan.json
