#!/usr/bin/env bash

set -euo pipefail

if [ "${TFACTION_DEBUG:-}" = true ]; then
	set -x
fi

# In the pull request created by Renovate, the result of `terraform plan` must be `No change` to enable automerge safely.
# If you allow changes, please set the pull request label `renovate-change`.
if [ "$CI_INFO_PR_AUTHOR" = "$RENOVATE_LOGIN" ]; then
	if ! grep -x renovate-change "$CI_INFO_TEMP_DIR/labels.txt" >/dev/null 2>&1; then
		github-comment post \
			--config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
			-var "tfaction_target:$TFACTION_TARGET" \
			-k renovate-plan-change
		exit 1
	fi
fi
