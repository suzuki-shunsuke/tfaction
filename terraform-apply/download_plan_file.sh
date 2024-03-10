#!/usr/bin/env bash

set -euo pipefail

filename=tfplan.binary
artifact_name=terraform_plan_file_${TFACTION_TARGET//\//__}
branch=$CI_INFO_HEAD_REF
workflow=$PLAN_WORKFLOW_NAME

pr_head_sha=$(jq -r ".head.sha" "$CI_INFO_TEMP_DIR/pr.json")

run_id=$(gh run list -c "$pr_head_sha" -w "$workflow" -b "$branch" -L 1 --json databaseId --jq '.[0].databaseId')

if [ -z "$run_id" ]; then
	echo "::error::No workflow run is found (branch: $branch, commit:$pr_head_sha, workflow: $workflow)"
	exit 1
fi

tempdir=$(mktemp -d)

gh run download -D "$tempdir" -n "$artifact_name" "$run_id"
cp "$tempdir/$filename" tfplan.binary
