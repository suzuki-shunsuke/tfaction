#!/usr/bin/env bash

set -eu
set -o pipefail

if [ "$ISSUE_STATE" = open ] && [ "$code" -eq 0 ]; then
	gh issue close \
		--repo "$ISSUE_REPO_OWNER/$ISSUE_REPO_NAME" \
		"$ISSUE_NUMBER"
elif [ "$ISSUE_STATE" = closed ] && [ "$code" -ne 0 ]; then
	gh issue reopen \
		--repo "$ISSUE_REPO_OWNER/$ISSUE_REPO_NAME" \
		"$ISSUE_NUMBER"
fi
