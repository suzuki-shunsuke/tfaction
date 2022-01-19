#!/usr/bin/env bash

set -eu
set -o pipefail

TARGET=${TARGET:-${TFACTION_TARGET:-}}

github-comment exec -- aws s3 cp "s3://$S3_BUCKET_NAME_PLAN_FILE/$CI_INFO_PR_NUMBER/$TARGET/tfplan.binary" tfplan.binary

author=$CI_INFO_PR_AUTHOR
if [[ $author =~ \[bot\]$ ]]; then
	author=suzuki-shunsuke
fi

set +e
tfcmt -var "target:$TARGET" -var "author:$author" apply -- terraform apply -auto-approve -input=false tfplan.binary
code=$?
set -e

while read -r pr_number; do
	if [ "$CI_INFO_PR_NUMBER" = "$pr_number" ]; then
		# To prevent infinite loop
		continue
	fi
	echo "===> Update PR $pr_number" >&2
	env GITHUB_TOKEN="$GITHUB_APP_TOKEN" gh api -X PUT "repos/{owner}/{repo}/pulls/${pr_number}/update-branch" || :
done < <(github-comment exec -- gh pr list --json number -L 100 -l "$TARGET" -q ".[].number")

if [ "$code" = "0" ]; then
	exit 0
fi

tfcmt -var "target:$TARGET" plan -- terraform plan -out tfplan.binary -input=false
github-comment exec -- aws s3 cp tfplan.binary "s3://$S3_BUCKET_NAME_PLAN_FILE/$CI_INFO_PR_NUMBER/$TARGET/tfplan.binary"

exit "$code"
