#!/usr/bin/env bash

set -euo pipefail

if [ "${TFACTION_DEBUG:-}" = true ]; then
	set -x
fi

apply_output=$(mktemp)

echo "::group::$TF_COMMAND apply"
set +e
tfcmt -var "target:$TFACTION_TARGET" apply -- "$TF_COMMAND" apply -auto-approve -no-color -input=false tfplan.binary 2>&1 | tee "$apply_output"
code=$?
set -e
echo "::endgroup::"

if [ -n "${TFACTION_DRIFT_ISSUE_NUMBER:-}" ]; then
	tfcmt \
		-config "$GITHUB_ACTION_PATH/tfcmt-drift.yaml" \
		-owner "$TFACTION_DRIFT_ISSUE_REPO_OWNER" \
		-repo "$TFACTION_DRIFT_ISSUE_REPO_NAME" \
		-pr "$TFACTION_DRIFT_ISSUE_NUMBER" \
		-var "pr_url:$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/pull/$CI_INFO_PR_NUMBER" \
		-var "target:$TFACTION_TARGET" \
		apply -- bash -c "cat $apply_output && exit $code" || : # Ignore the failure
fi

rm "$apply_output" || : # Ignore the failure

if [ "$DISABLE_UPDATE_RELATED_PULL_REQUESTS" = true ]; then
	echo "::notice ::Skip updating related pull requests"
fi

exit "$code"
