#!/usr/bin/env bash

set -euo pipefail

if [ -n "${TFACTION_DRIFT_ISSUE_NUMBER:-}" ]; then
	export TFCMT_CONFIG=$GITHUB_ACTION_PATH/tfcmt-drift.yaml
fi

opts=""
if [ "${DESTROY:-}" = true ]; then
	opts=-destroy
	echo "::warning::The destroy option is enabled"
fi
set +e
tfcmt -var "target:$TFACTION_TARGET" -var "destroy:${DESTROY:-}" plan -- \
	"$TF_COMMAND" plan -no-color -detailed-exitcode -out "$(pwd)/tfplan.binary" -input=false $opts
code=$?
set -e

if [ "$code" -eq 1 ]; then
	exit 1
fi

github-comment exec -- "$TF_COMMAND" show -json tfplan.binary >tfplan.json

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
