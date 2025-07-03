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
	echo "changed=true" >>"$GITHUB_OUTPUT"
	exit 0
fi

github-comment exec \
	--config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
	-k tfmigrate-plan \
	-var "tfaction_target:$TFACTION_TARGET" \
	-- tfmigrate plan --out tfplan.binary

github-comment exec -- "$TF_COMMAND" show -json tfplan.binary >tfplan.json

tempdir=$(mktemp -d)
cp tfplan.binary "$tempdir/tfplan.binary"
cp tfplan.json "$tempdir/tfplan.json"
echo "plan_json=${tempdir}/tfplan.json" >> "$GITHUB_OUTPUT"
echo "plan_binary=${tempdir}/tfplan.binary" >> "$GITHUB_OUTPUT"
