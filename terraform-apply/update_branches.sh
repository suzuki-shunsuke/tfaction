#!/usr/bin/env bash

set -euo pipefail

if [ "${TFACTION_DEBUG:-}" = true ]; then
	set -x
fi

echo "$PR_NUMBERS" | while read -r pr_number; do
	if [ "$CI_INFO_PR_NUMBER" = "$pr_number" ]; then
		# To prevent infinite loop
		continue
	fi
	echo "::notice:: Update PR ${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/pull/$pr_number" >&2
	gh api -X PUT "repos/{owner}/{repo}/pulls/${pr_number}/update-branch" || :
done
