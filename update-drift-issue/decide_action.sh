#!/usr/bin/env bash

set -eu

cat "$ISSUE_PATH"
length=$(jq length < "$ISSUE_PATH")
echo "length=$length" >> "$GITHUB_OUTPUT"
if [ 1 -eq "$length" ]; then
	echo "number=$(jq -r ".[0].number" < "$ISSUE_PATH")" >> "$GITHUB_OUTPUT"

	title=$(jq -r ".[0].title" < "$ISSUE_PATH")
	# shellcheck disable=SC2001
	target=$(echo "$title" | sed "s|Terraform Drift (\(.*\))|\1|")
	echo "TFACTION_TARGET=$target" >> "$GITHUB_ENV"

	state=$(jq -r ".[0].state" < "$ISSUE_PATH")
	echo "state=$state" >> "$GITHUB_OUTPUT"

	if [ "$state" = open ]; then
		if [ "$SUCCESS" = true ]; then
			action=close
		fi
	else
		if [ "$SUCCESS" != true ]; then
			action=reopen
		fi
	fi
else
	action=create
fi
echo "action=$action" >> "$GIHTUB_OUTPUT"
