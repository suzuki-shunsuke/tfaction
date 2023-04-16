#!/usr/bin/env bash

set -eu
set -o pipefail

issue_path=$(mktemp)
export ISSUE_PATH=$issue_path
if [ -n "${TFACTION_TARGET:-}" ]; then
	gh search issues \
		--json state,number \
		-L 1 \
		--repo "$REPO" \
		--label terraform-drift \
		--match title "Terraform Drift ($TFACTION_TARGET)" \
		> "$issue_path"
	bash "$GITHUB_ACTION_PATH/decide_action.sh"
else
	gh search issues \
		--json state,number,title \
		-L 1 \
		--repo "$REPO" \
		--label terraform-drift \
		--sort updated \
		--order asc \
		> "$issue_path"
	length=$(jq length < issues.json)
	echo "length=$length" >> "$GITHUB_OUTPUT"
	if [ 1 -eq "$length" ]; then
		echo "state=$(jq -r ".[0].state" < "$issue_path")" >> "$GITHUB_OUTPUT"
		echo "number=$(jq -r ".[0].number" < "$issue_path")" >> "$GITHUB_OUTPUT"
	fi
	bash "$GITHUB_ACTION_PATH/decide_action.sh"
fi
