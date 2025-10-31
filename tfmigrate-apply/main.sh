#!/usr/bin/env bash

set -euo pipefail

if [ "${TFACTION_DEBUG:-}" = true ]; then
	set -x
fi

if [ -z "${TFMIGRATE_EXEC_PATH:-}" ] && [ "$TF_COMMAND" != terraform ]; then
	TFMIGRATE_EXEC_PATH=$TF_COMMAND
fi

apply_output=$(mktemp)

echo "::group::tfmigrate apply"
set +e
github-comment exec \
	--config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
	-var "tfaction_target:$TFACTION_TARGET" \
	-k tfmigrate-apply -- \
	tfmigrate apply 2>&1 | tee "$apply_output"
code=$?
set -e
echo "::endgroup::"

if [ -n "${TFACTION_DRIFT_ISSUE_NUMBER:-}" ]; then
	github-comment exec \
		--config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
		-org "$TFACTION_DRIFT_ISSUE_REPO_OWNER" \
		-repo "$TFACTION_DRIFT_ISSUE_REPO_NAME" \
		-pr "$TFACTION_DRIFT_ISSUE_NUMBER" \
		-var "pr_url:$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/pull/$CI_INFO_PR_NUMBER" \
		-var "target:$TFACTION_TARGET" \
		-k drift-apply \
		-- bash -c "cat $apply_output && exit $code" || : # Ignore the failure
fi

rm "$apply_output" || : # Ignore the failure

if [ "$DISABLE_UPDATE_RELATED_PULL_REQUESTS" = true ]; then
	echo "::notice ::Skip updating related pull requests"
fi

exit "$code"
