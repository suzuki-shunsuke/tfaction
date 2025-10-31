#!/usr/bin/env bash

set -euo pipefail

if [ "${TFACTION_DEBUG:-}" = true ]; then
	set -x
fi

while read -r pr_number; do
	if [ "$CI_INFO_PR_NUMBER" = "$pr_number" ]; then
		# To prevent infinite loop
		continue
	fi
	echo "===> Update PR $pr_number" >&2
	gh api -X PUT "repos/{owner}/{repo}/pulls/${pr_number}/update-branch" || :
done < <(github-comment exec -config "${GITHUB_ACTION_PATH}/github-comment.yaml" -var "tfaction_target:$TFACTION_TARGET" -- gh pr list --json number -L 100 -l "$TFACTION_TARGET" -S "-label:tfaction:disable-auto-update" -q ".[].number")
