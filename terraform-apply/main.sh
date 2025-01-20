#!/usr/bin/env bash

set -euo pipefail

if [ "${TFACTION_DEBUG:-}" = true ]; then
	set -x
fi

bash "$GITHUB_ACTION_PATH/download_plan_file.sh"

apply_output=$(mktemp)

set +e
tfcmt -var "target:$TFACTION_TARGET" apply -- "$TF_COMMAND" apply -auto-approve -no-color -input=false tfplan.binary 2>&1 | tee "$apply_output"
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
	gh api -X PUT "repos/{owner}/{repo}/pulls/${pr_number}/update-branch" || :
done < <(github-comment exec -config "${GITHUB_ACTION_PATH}/github-comment.yaml" -var "tfaction_target:$TFACTION_TARGET" -- gh pr list --json number -L 100 -l "$TFACTION_TARGET" -S "-label:tfaction:disable-auto-update" -q ".[].number")

exit "$code"
