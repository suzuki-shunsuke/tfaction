#!/usr/bin/env bash

set -euo pipefail
shopt -s nullglob # To ignore *.tf and *.tf.json when no files are found

conftest -v # Install conftest in advance to exclude aqua lazy install log from github-comment's comment

if [ -n "$CONFTEST_POLICY_DIRECTORY" ]; then
	if [ ! -d "$ROOT_DIR/$CONFTEST_POLICY_DIRECTORY" ]; then
		echo "::error::The conftest directory $CONFTEST_POLICY_DIRECTORY isn't found"
		exit 1
	fi
	github-comment exec \
		--config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
		-var "tfaction_target:$TFACTION_TARGET" \
		-k conftest -- \
			conftest test --no-color -p "$ROOT_DIR/$CONFTEST_POLICY_DIRECTORY" *.tf *.tf.json
fi

if [ -n "$CONFTEST_COMBINE_POLICY_DIRECTORY" ]; then
	if [ ! -d "$ROOT_DIR/$CONFTEST_COMBINE_POLICY_DIRECTORY" ]; then
		echo "::error::The conftest directory $CONFTEST_COMBINE_POLICY_DIRECTORY isn't found"
		exit 1
	fi
	github-comment exec \
		--config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
		-var "tfaction_target:$TFACTION_TARGET" \
		-k conftest -- \
			conftest test --no-color --combine -p "$ROOT_DIR/$CONFTEST_COMBINE_POLICY_DIRECTORY" *.tf *.tf.json
fi
