#!/usr/bin/env bash

set -euo pipefail

filename=tfplan.binary
artifact_name=terraform_plan_file_${TFACTION_TARGET//\//__}
branch=$CI_INFO_HEAD_REF

pr_head_sha=$(jq -r ".head.sha" "$CI_INFO_TEMP_DIR/pr.json")

# https://github.com/suzuki-shunsuke/tfaction/pull/1570#issuecomment-1987382651
# We don't use gh run list's -c option because 
# 1. this requires GitHub CLI v2.40.0 or newer
# 2. we should check the latest workflow run
body=$(github-comment exec \
	-k list-workflow-runs \
	-config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
	-var "tfaction_target:$TFACTION_TARGET" \
	-- gh run list -w "$PLAN_WORKFLOW_NAME" -b "$branch" -L 1 --json headSha,databaseId --jq '.[0]')

if [ -z "$body" ]; then
	echo "::error::body is empty. No workflow run is found"
	exit 1
fi

run_id=$(echo "$body" | jq -r ".databaseId")
head_sha=$(echo "$body" | jq -r ".headSha")

if [ "$head_sha" != "$pr_head_sha" ]; then
	echo "::error::workflow run's headSha ($head_sha) is different from the associated pull request's head sha ($pr_head_sha)"
	github-comment post \
		-config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
		-k invalid-workflow-sha \
		-var "tfaction_target:$TFACTION_TARGET" \
		-var "wf_sha:$head_sha" \
		-var "pr_sha:$pr_head_sha"
	exit 1
fi

tempdir=$(mktemp -d)

github-comment exec \
	-config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
	-k download-plan-file \
	-var "tfaction_target:$TFACTION_TARGET" \
	-- gh run download -D "$tempdir" -n "$artifact_name" "$run_id"
cp "$tempdir/$filename" tfplan.binary
