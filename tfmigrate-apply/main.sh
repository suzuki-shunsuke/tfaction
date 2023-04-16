#!/usr/bin/env bash

set -eu
set -o pipefail

apply_output=$(mktemp)

set +e
github-comment exec \
	--config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
	-var "tfaction_target:$TFACTION_TARGET" \
	-k tfmigrate-apply -- \
		tfmigrate apply 2>&1 | tee "$apply_output"
code=$?
set -e

if [ -n "$DRIFT_ISSUE_NUMBER" ]; then
	github-comment exec \
	  --config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
		-org "$DRIFT_ISSUE_REPO_OWNER" \
		-repo "$DRIFT_ISSUE_REPO_NAME" \
		-pr "$DRIFT_ISSUE_NUMBER" \
		-var "pr_url:$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/pull/$CI_INFO_PR_NUMBER" \
		-var "target:$TFACTION_TARGET" \
		-k drift-apply \
		-- cat "$apply_output" || : # Ignore the failure

	if [ "$code" -eq 0 ] && [ "$DRIFT_ISSUE_STATE" = "open" ]; then
		gh issue close \
			--repo "$DRIFT_ISSUE_REPO_OWNER/$DRIFT_ISSUE_REPO_NAME" \
			"$DRIFT_ISSUE_NUMBER"
	elif [ "$code" -ne 0 ] && [ "$DRIFT_ISSUE_STATE" = "closed" ]; then
		gh issue reopen \
			--repo "$DRIFT_ISSUE_REPO_OWNER/$DRIFT_ISSUE_REPO_NAME" \
			"$DRIFT_ISSUE_NUMBER"
	fi
fi

rm "$apply_output" || : # Ignore the failure

while read -r pr_number; do
	if [ "$CI_INFO_PR_NUMBER" = "$pr_number" ]; then
		# To prevent infinite loop
		continue
	fi
	echo "===> Update PR $pr_number" >&2
	env GITHUB_TOKEN="$GITHUB_APP_TOKEN" gh api -X PUT "repos/{owner}/{repo}/pulls/${pr_number}/update-branch" || :
done < <(github-comment exec -- gh pr list --json number -L 100 -l "$TFACTION_TARGET" -q ".[].number")

exit "$code"
