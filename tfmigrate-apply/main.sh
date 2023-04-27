#!/usr/bin/env bash

set -eu
set -o pipefail

set +e
github-comment exec \
	--config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
	-var "tfaction_target:$TFACTION_TARGET" \
	-k tfmigrate-apply -- \
		tfmigrate apply
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
done < <(github-comment exec -- gh pr list --json number -L 100 -l "$TFACTION_TARGET" -q ".[].number")

exit "$code"
