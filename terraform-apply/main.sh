#!/usr/bin/env bash

set -eu
set -o pipefail

if [ -n "${S3_BUCKET_NAME_PLAN_FILE:-}" ]; then
	github-comment exec \
		-config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
		-var "tfaction_target:$TFACTION_TARGET" -- \
		aws s3 cp "s3://$S3_BUCKET_NAME_PLAN_FILE/$CI_INFO_PR_NUMBER/$TFACTION_TARGET/tfplan.binary" tfplan.binary
elif [ -n "${GCS_BUCKET_NAME_PLAN_FILE:-}" ]; then
	github-comment exec \
		-config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
		-var "tfaction_target:$TFACTION_TARGET" -- \
		gsutil cp "gs://$GCS_BUCKET_NAME_PLAN_FILE/$CI_INFO_PR_NUMBER/$TFACTION_TARGET/tfplan.binary" tfplan.binary
fi

set +e
tfcmt -var "target:$TFACTION_TARGET" apply -- terraform apply -auto-approve -no-color -input=false tfplan.binary
code=$?
set -e

if [ "$DISABLE_UPDATE_RELATED_PULL_REQUESTS" = true ]; then
	echo "::notice ::Skip updating related pull requests"
	exit "$code"
fi

while read -r pr_number; do
	if [ "$CI_INFO_PR_NUMBER" = "$pr_number" ]; then
		# To prevent infinite loop
		continue
	fi
	echo "===> Update PR $pr_number" >&2
	env GITHUB_TOKEN="$GITHUB_APP_TOKEN" gh api -X PUT "repos/{owner}/{repo}/pulls/${pr_number}/update-branch" || :
done < <(github-comment exec -config "${GITHUB_ACTION_PATH}/github-comment.yaml" -var "tfaction_target:$TFACTION_TARGET" -- gh pr list --json number -L 100 -l "$TFACTION_TARGET" -q ".[].number")

exit "$code"
