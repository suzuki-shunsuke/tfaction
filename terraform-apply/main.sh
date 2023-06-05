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

apply_output=$(mktemp)

set +e
tfcmt -var "target:$TFACTION_TARGET" apply -- terraform apply -auto-approve -no-color -input=false tfplan.binary 2>&1 | tee "$apply_output"
code=$?
set -e

if [ -n "${TFACTION_DRIFT_ISSUE_NUMBER:-}" ]; then
	tfcmt \
		-config "$GITHUB_ACTION_PATH/tfcmt-drift.yaml" \
		-owner "$TFACTION_DRIFT_ISSUE_REPO_OWNER" \
		-repo "$TFACTION_DRIFT_ISSUE_REPO_NAME" \
		-pr "$TFACTION_DRIFT_ISSUE_NUMBER" \
		-var "pr_url:$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/pull/$CI_INFO_PR_NUMBER" \
		-var "target:$TFACTION_TARGET" \
		apply -- bash -c "cat $apply_output && exit $code" || : # Ignore the failure
fi

rm "$apply_output" || : # Ignore the failure

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
