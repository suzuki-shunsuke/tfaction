#!/usr/bin/env bash

set -euo pipefail

if [ -n "$CONFTEST_POLICY_DIRECTORY" ] && [ ! -d "$ROOT_DIR/$CONFTEST_POLICY_DIRECTORY" ]; then
	echo "::error::The conftest directory $CONFTEST_POLICY_DIRECTORY isn't found"
	exit 1
fi

CONFTEST_POLICY_DIRECTORY=$ROOT_DIR/${CONFTEST_POLICY_DIRECTORY:-policy}

if [ ! -d "$CONFTEST_POLICY_DIRECTORY" ]; then
	exit 0
fi

github-comment exec -- "$TF_COMMAND" show -json tfplan.binary >tfplan.json
conftest -v # Install conftest in advance to exclude aqua lazy install log from github-comment's comment
github-comment exec \
	--config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
	-var "tfaction_target:$TFACTION_TARGET" \
	-k conftest -- \
		conftest test --no-color -p "$CONFTEST_POLICY_DIRECTORY" tfplan.json
