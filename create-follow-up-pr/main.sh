#!/usr/bin/env bash

set -euo pipefail

if [ "${TFACTION_DEBUG:-}" = true ]; then
	set -x
fi

# create a pull request
# 1. create a remote branch
# 2. open pull request

if ! group_label=$(grep -E "tfaction:pr/\d+" "$CI_INFO_TEMP_DIR/labels.txt"); then
	group_label="tfaction:pr/$CI_INFO_PR_NUMBER"
	gh label create "$group_label" || :
fi

FOLLOW_UP_BRANCH="follow-up-$CI_INFO_PR_NUMBER-$TFACTION_TARGET-$(date +%Y%m%dT%H%M%S)"
export FOLLOW_UP_BRANCH

bash "$GITHUB_ACTION_PATH/create_commit.sh"

pr_title="chore($TFACTION_TARGET): follow up #$CI_INFO_PR_NUMBER"

create_opts=(-H "$FOLLOW_UP_BRANCH" -t "$pr_title" -l "$group_label")
mention=""
if ! [[ $CI_INFO_PR_AUTHOR =~ \[bot\] ]]; then
	create_opts+=(-a "$CI_INFO_PR_AUTHOR")
	mention="@$CI_INFO_PR_AUTHOR"
fi
if ! [[ $GITHUB_ACTOR =~ \[bot\] ]] && [ "$CI_INFO_PR_AUTHOR" != "$GITHUB_ACTOR" ]; then
	create_opts+=(-a "$GITHUB_ACTOR")
	mention="@$GITHUB_ACTOR $mention"
fi
if [ "$TFACTION_DRAFT_PR" = "true" ]; then
	create_opts+=(-d)
fi

pr_body="This pull request was created automatically to follow up the failure of apply.

Follow up #$CI_INFO_PR_NUMBER ([failed workflow]($GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID))

1. Check the error message #$CI_INFO_PR_NUMBER
1. Check the result of \`terraform plan\`
1. Add commits to this pull request and fix the problem if needed
1. Review and merge this pull request"

create_opts+=(-b "$pr_body")

follow_up_pr_url=$(gh pr create "${create_opts[@]}")
echo "::notice:: The follow up pull request: $follow_up_pr_url"

github-comment post \
	-config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
	-var "tfaction_target:$TFACTION_TARGET" \
	-var "mentions:${mention}" \
	-var "follow_up_pr_url:$follow_up_pr_url" \
	-k create-follow-up-pr
