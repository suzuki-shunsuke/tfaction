#!/usr/bin/env bash

set -eu
set -o pipefail

if [ -n "${TFACTION_DRIFT_ISSUE_NUMBER:-}" ]; then
	export TFCMT_CONFIG=$GITHUB_ACTION_PATH/tfcmt-drift.yaml
fi

set +e
tfcmt -var "target:$TFACTION_TARGET" plan -- \
	terraform plan -no-color -detailed-exitcode -out tfplan.binary -input=false
code=$?
set -e

if [ -z "${TFACTION_DRIFT_ISSUE_NUMBER:-}" ] && [ "$code" = "1" ]; then
	bash "$GITHUB_ACTION_PATH/delete_old_plan.sh"
	exit 1
fi

if [ -z "${TFACTION_DRIFT_ISSUE_NUMBER:-}" ]; then
	bash "$GITHUB_ACTION_PATH/upload_plan.sh"
fi

if [ -d "$ROOT_DIR/policy" ]; then
	bash "$GITHUB_ACTION_PATH/conftest.sh"
fi

if [ "$code" = "0" ]; then
	exit 0
fi

if [ -z "${TFACTION_DRIFT_ISSUE_NUMBER:-}" ]; then
	bash "$GITHUB_ACTION_PATH/renovate_change.sh"
fi

if [ -n "${TFACTION_DRIFT_ISSUE_NUMBER:-}" ]; then
	# If `terraform plan` has changes, drift is detected and the job fails.
	exit "$code"
fi
