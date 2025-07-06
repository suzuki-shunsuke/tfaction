#!/usr/bin/env bash

set -euo pipefail

if [ "${TFACTION_DEBUG:-}" = true ]; then
	set -x
fi

# create a pull request
# 1. create a remote branch
# 2. open pull request

bash "$GITHUB_ACTION_PATH/create_commit.sh"

create_opts=(-H "$BRANCH" -t "$PR_TITLE")

if [ "$FOLLOW_UP_PR_GROUP_LABEL_ENABLED" = true ] && [ -n "${GROUP_lABEL:-}" ]; then
	create_opts+=(-l "$GROUP_LABEL")
fi

if [ -n "${ASSIGNEES:-}" ]; then
	create_opts+=("$ASSIGNEES")
fi
if [ "$TFACTION_DRAFT_PR" = "true" ]; then
	create_opts+=(-d)
fi

create_opts+=(-b "$PR_BODY")

follow_up_pr_url=$(gh pr create "${create_opts[@]}")
echo "::notice:: The follow up pull request: $follow_up_pr_url"

github-comment post \
	-config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
	-var "tfaction_target:$TFACTION_TARGET" \
	-var "mentions:${MENTIONS}" \
	-var "follow_up_pr_url:$follow_up_pr_url" \
	-k create-follow-up-pr
