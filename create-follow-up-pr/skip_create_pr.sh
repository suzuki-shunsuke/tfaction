#!/usr/bin/env bash

set -euo pipefail

if [ "${TFACTION_DEBUG:-}" = true ]; then
	set -x
fi

# create a branch with empty commit
# 1. create a remote branch

FOLLOW_UP_BRANCH="follow-up-$CI_INFO_PR_NUMBER-$TFACTION_TARGET-$(date +%Y%m%dT%H%M%S)"
export FOLLOW_UP_BRANCH
bash "$GITHUB_ACTION_PATH/create_commit.sh"

pr_title="chore($TFACTION_TARGET): follow up #$CI_INFO_PR_NUMBER"

create_opts=(-R "$GITHUB_REPOSITORY" -H "$FOLLOW_UP_BRANCH" -t "\"$pr_title\"" -b "\"Follow up #$CI_INFO_PR_NUMBER\"")
mention=""
if ! [[ $CI_INFO_PR_AUTHOR =~ \[bot\] ]]; then
	mention="@$CI_INFO_PR_AUTHOR"
fi
if ! [[ $GITHUB_ACTOR =~ \[bot\] ]] && [ "$CI_INFO_PR_AUTHOR" != "$GITHUB_ACTOR" ]; then
	mention="@$GITHUB_ACTOR $mention"
fi
if [ "$TFACTION_DRAFT_PR" = "true" ]; then
	create_opts+=(-d)
fi

github-comment post \
	-config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
	-k skip-create-follow-up-pr \
	-var "tfaction_target:$TFACTION_TARGET" \
	-var "mentions:${mention}" \
	-var "opts:${create_opts[*]}"
