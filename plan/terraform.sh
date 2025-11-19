#!/usr/bin/env bash

set -euo pipefail

if [ "${TFACTION_DEBUG:-}" = true ]; then
	set -x
fi

if [ -n "${TFACTION_DRIFT_ISSUE_NUMBER:-}" ]; then
	export TFCMT_CONFIG=$GITHUB_ACTION_PATH/tfcmt-drift.yaml
fi

opts=""
if [ "${DESTROY:-}" = true ]; then
	opts=-destroy
	echo "::warning::The destroy option is enabled"
fi

echo "::group::$TF_COMMAND plan"
set +e
tfcmt -var "target:$TFACTION_TARGET" -var "destroy:${DESTROY:-}" plan -- \
	"$TF_COMMAND" plan -no-color -detailed-exitcode -out "${PWD}/tfplan.binary" -input=false $opts
code=$?
set -e
echo "::endgroup::"

echo "detailed_exitcode=$code" >>"$GITHUB_OUTPUT"
tempdir=$(mktemp -d)
cp tfplan.binary "$tempdir/tfplan.binary"
echo "plan_binary=${tempdir}/tfplan.binary" >>"$GITHUB_OUTPUT"

if [ "$code" -eq 1 ]; then
	exit 1
fi

echo "::group::$TF_COMMAND show"
github-comment exec -- "$TF_COMMAND" show -json tfplan.binary >tfplan.json
echo "::endgroup::"
cp tfplan.json "$tempdir/tfplan.json"
echo "plan_json=${tempdir}/tfplan.json" >>"$GITHUB_OUTPUT"

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
