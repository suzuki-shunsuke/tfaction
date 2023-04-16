#!/usr/bin/env bash

set -eu

cat "$ISSUE_PATH"
length=$(jq length < "$ISSUE_PATH")
echo "length=$length" >> "$GITHUB_OUTPUT"
if [ 1 -ne "$length" ]; then
	echo action=create >> "$GITHUB_OUTPUT"
	exit 0
fi

echo "number=$(jq -r ".[0].number" < "$ISSUE_PATH")" >> "$GITHUB_OUTPUT"

if [ -z "$TFACTION_TARGET" ]; then
	title=$(jq -r ".[0].title" < "$ISSUE_PATH")
	# shellcheck disable=SC2001
	target=$(echo "$title" | sed "s|Terraform Drift (\(.*\))|\1|")
	if [ -z "$target" ]; then
		# TODO log
		exit 1
	fi
	echo "TFACTION_TARGET=$target" >> "$GITHUB_ENV"
fi

state=$(jq -r ".[0].state" < "$ISSUE_PATH")
echo "state=$state" >> "$GITHUB_OUTPUT"

if [ "$state" = open ]; then
	if [ "$JOB_STATUS" = success ]; then
		action=close
	fi
else
	if [ "$JOB_STATUS" != success ]; then
		action=reopen
	fi
fi
echo "action=$action" >> "$GIHTUB_OUTPUT"
