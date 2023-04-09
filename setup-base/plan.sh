#!/usr/bin/env bash

set -eu
set -o pipefail

set +e
tfcmt -var "target:$TFACTION_TARGET" plan -- \
	terraform plan -no-color -detailed-exitcode -input=false
code=$?
set -e
echo "code=$code" >> "$GITHUB_OUTPUT"
