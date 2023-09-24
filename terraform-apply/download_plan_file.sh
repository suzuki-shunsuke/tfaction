#!/usr/bin/env bash

set -euo pipefail

filename=tfplan.binary
artifact_name=terraform_plan_file_${TFACTION_TARGET//\//__}
branch=$CI_INFO_HEAD_REF
workflow=$PLAN_WORKFLOW_NAME

pr_head_sha=$(jq -r ".head.sha" "$CI_INFO_TEMP_DIR/pr.json")

body=$(gh run list -w "$workflow" -b "$branch" -L 1 --json headSha,databaseId --jq '.[0]')
run_id=$(echo "$body" | jq -r ".databaseId")
head_sha=$(echo "$body" | jq -r ".headSha")

if [ "$head_sha" != "$pr_head_sha" ]; then
	echo "::error::workflow run's headSha is different from the associated pull request's head sha"
	github-comment post -k invalid-workflow-sha \
		-var "wf_sha:$head_sha" -var "pr_sha:$pr_head_sha"
	exit 1
fi

tempdir=$(mktemp -d)

gh run download -D "$tempdir" -n "$artifact_name" "$run_id"
cp "$tempdir/$filename" tfplan.binary
