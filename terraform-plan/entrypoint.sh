#!/usr/bin/env bash

set -eu
set -o pipefail

if [ -z "${TFACTION_DRIFT_ISSUE_NUMBER:-}" ]; then
	bash "$GITHUB_ACTION_PATH/main.sh"
	exit 0
fi

set +e
bash "$GITHUB_ACTION_PATH/main.sh"
code=$?
set -e
code="$code" bash "$GITHUB_ACTION_PATH/update_drift_issue.sh"
exit "$code"
