#!/usr/bin/env bash

set -euo pipefail

github-comment exec -- terraform show -json tfplan.binary >tfplan.json
conftest -v # Install conftest in advance to exclude aqua lazy install log from github-comment's comment
github-comment exec \
	--config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
	-var "tfaction_target:$TFACTION_TARGET" \
	-k conftest -- \
		conftest test --no-color -p "$CONFTEST_POLICY_DIRECTORY" tfplan.json
