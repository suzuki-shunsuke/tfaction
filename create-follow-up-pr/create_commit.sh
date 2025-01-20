#!/usr/bin/env bash

set -euo pipefail

if [ "${TFACTION_DEBUG:-}" = true ]; then
	set -x
fi

follow_up_pr_file="$WORKING_DIR/.tfaction/failed-prs"
if [ ! -f "$follow_up_pr_file" ]; then
	mkdir -p "$WORKING_DIR/.tfaction"
	echo "# This file is created and updated by tfaction for follow up pull requests.
# You can remove this file safely." >"$follow_up_pr_file"
fi
echo "$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/pull/$CI_INFO_PR_NUMBER" >>"$follow_up_pr_file"
ghcp commit \
	-r "$GITHUB_REPOSITORY" -b "$FOLLOW_UP_BRANCH" \
	-m "chore: create a commit to open follow up pull request
Follow up #$CI_INFO_PR_NUMBER
$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID" \
	-C "$GITHUB_WORKSPACE" \
	"$follow_up_pr_file"
