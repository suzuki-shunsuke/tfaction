#!/usr/bin/env bash

set -eu
set -o pipefail

set +e
tfcmt -var "target:$TFACTION_TARGET" plan -- \
	terraform plan -detailed-exitcode -out tfplan.binary -input=false
code=$?
set -e

if [ "$code" = "1" ]; then
	echo "===> Delete old plan file to prevent the accident" >&2
	aws s3 rm "s3://$S3_BUCKET_NAME_PLAN_FILE/$PR_NUMBER/$TFACTION_TARGET/tfplan.binary" || :
	exit 1
fi

if [ -n "${S3_BUCKET_NAME_PLAN_FILE:-}" ]; then
	github-comment exec -- aws s3 cp tfplan.binary "s3://$S3_BUCKET_NAME_PLAN_FILE/$PR_NUMBER/$TFACTION_TARGET/tfplan.binary"
fi
if [ -n "${GCS_BUCKET_NAME_PLAN_FILE:-}" ]; then
	github-comment exec -- gsutil cp tfplan.binary "gs://$GCS_BUCKET_NAME_PLAN_FILE/$PR_NUMBER/$TFACTION_TARGET/tfplan.binary"
fi

if [ -d "$ROOT_DIR/policy" ]; then
	github-comment exec -- terraform show -json tfplan.binary >tfplan.json
	conftest -v # Install conftest in advance to exclude aqua lazy install log from github-comment's comment
	github-comment exec \
		--config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
		-k conftest -- \
			conftest test --no-color -p "$ROOT_DIR/policy" tfplan.json
fi

if [ "$code" = "0" ]; then
	exit 0
fi

# In the pull request created by Renovate, the result of `terraform plan` must be `No change` to enable automerge safely.
# If you allow changes, please set the pull request label `renovate-change`.
if [ "$CI_INFO_PR_AUTHOR" = "$RENOVATE_LOGIN" ]; then
	if ! grep -x renovate-change "$CI_INFO_TEMP_DIR/labels.txt" >/dev/null 2>&1; then
		github-comment post --config "${GITHUB_ACTION_PATH}/github-comment.yaml" -k renovate-plan-change
		exit 1
	fi
fi
