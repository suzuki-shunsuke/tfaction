#!/usr/bin/env bash

set -eu
set -o pipefail

set +e
tfcmt \
	-owner "$ISSUE_REPO_OWNER" \
	-repo "$ISSUE_REPO_NAME" \
	-pr "$ISSUE_NUMBER" \
	-config "$GITHUB_ACTION_PATH/tfcmt.yaml" \
	-var "target:$TFACTION_TARGET" plan -- \
	terraform plan -no-color -detailed-exitcode -input=false
code=$?
set -e
echo "code=$code" >> "$GITHUB_OUTPUT"

if [ "$ISSUE_STATE" = open ] && [ "$code" -eq 0 ]; then
	gh issue close \
		--repo "$ISSUE_REPO_OWNER/$ISSUE_REPO_NAME" \
		"$ISSUE_NUMBER"
elif [ "$ISSUE_STATE" = closed ] && [ "$code" -ne 0 ]; then
	gh issue reopen \
		--repo "$ISSUE_REPO_OWNER/$ISSUE_REPO_NAME" \
		"$ISSUE_NUMBER"
fi
