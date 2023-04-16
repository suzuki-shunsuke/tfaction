#!/usr/bin/env bash

set -eu
set -o pipefail

issue_path=$(mktemp)
export ISSUE_PATH=$issue_path
gh search issues \
	--json state,number \
	-L 1 \
	--repo "$REPO" \
	--match title "Terraform Drift ($TFACTION_TARGET)" \
	> "$issue_path"
bash "$GITHUB_ACTION_PATH/decide_action.sh"
