#!/usr/bin/env bash

set -eu
set -o pipefail

set +e
tfcmt \
	-owner "$ISSUE_OWNER" \
	-repo "$ISSUE_REPO" \
	-pr "$ISSUE_NUMBER" \
	-config "$GITHUB_ACTION_PATH/tfcmt.yaml" \
	-var "target:$TFACTION_TARGET" plan -- \
	terraform plan -no-color -detailed-exitcode -input=false
code=$?
set -e
echo "code=$code" >> "$GITHUB_OUTPUT"

if [ "$ISSUE_STATE" = open ] && [ "$code" -eq 0 ]; then
	gh issue close \
		--repo "$ISSUE_OWENER/$ISSUE_REPO" \
		"$ISSUE_NUMBER"
elif [ "$ISSUE_STATE" = closed ] && [ "$code" -ne 0 ]; then
	gh issue reopen \
		--repo "$ISSUE_OWENER/$ISSUE_REPO" \
		"$ISSUE_NUMBER"
fi
