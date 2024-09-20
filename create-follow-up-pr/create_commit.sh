#!/usr/bin/env bash

set -euo pipefail

if [ "${CREATE_FOLLOW_UP_PR_FILE:-}" = "true" ]; then
	follow_up_pr_file="$WORKING_DIR/.tfaction-follow-up-pr"
	if [ ! -f "$follow_up_pr_file" ]; then
		echo "# This file is created and updated for follow up pull requests.
# You can remove this file safely." > "$follow_up_pr_file"
	fi
	echo "$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID" >> "$follow_up_pr_file"
	ghcp commit \
		-r "$GITHUB_REPOSITORY" -b "$FOLLOW_UP_BRANCH" \
		-m "chore: create a commit to open follow up pull request
Follow up #$CI_INFO_PR_NUMBER
$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID" \
        -C "$GITHUB_WORKSPACE" \
		"$follow_up_pr_file"
else
	ghcp empty-commit \
		-r "$GITHUB_REPOSITORY" -b "$FOLLOW_UP_BRANCH" \
		-m "chore: empty commit to open follow up pull request
Follow up #$CI_INFO_PR_NUMBER
$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
fi
