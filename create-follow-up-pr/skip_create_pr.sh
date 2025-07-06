#!/usr/bin/env bash

set -euo pipefail

if [ "${TFACTION_DEBUG:-}" = true ]; then
	set -x
fi

# create a branch with empty commit
# 1. create a remote branch

bash "$GITHUB_ACTION_PATH/create_commit.sh"

create_opts=(-R "$GITHUB_REPOSITORY" -H "$BRANCH" -t "\"$PR_TITLE\"" -b "\"Follow up #$CI_INFO_PR_NUMBER\"")
if [ "$TFACTION_DRAFT_PR" = "true" ]; then
	create_opts+=(-d)
fi
if [ "$FOLLOW_UP_PR_GROUP_LABEL_ENABLED" = true ] && [ -n "${GROUP_lABEL:-}" ]; then
	create_opts+=(-l "$GROUP_LABEL")
fi

github-comment post \
	-config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
	-k skip-create-follow-up-pr \
	-var "tfaction_target:$TFACTION_TARGET" \
	-var "mentions:${MENTIONS}" \
	-var "opts:${create_opts[*]}"
