#!/usr/bin/env bash

set -eu
set -o pipefail

if [ "$TFACTION_DRIFT_ISSUE_STATE" = open ] && [ "$code" -eq 0 ]; then
	gh issue close \
		--repo "$TFACTION_DRIFT_ISSUE_REPO_FULLNAME" \
		"$TFACTION_DRIFT_ISSUE_NUMBER"
elif [ "$TFACTION_DRIFT_ISSUE_STATE" = closed ] && [ "$code" -ne 0 ]; then
	gh issue reopen \
		--repo "$TFACTION_DRIFT_ISSUE_REPO_FULLNAME" \
		"$TFACTION_DRIFT_ISSUE_NUMBER"
fi
