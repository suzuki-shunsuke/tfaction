#!/usr/bin/env bash

set -eu
set -o pipefail

issue_path=$(mktemp)
gh search issues \
	--json state,number \
	-L 1 \
	--repo "$REPO" \
	--label terraform-drift \
	--match title "Terraform Drift ($TFACTION_TARGET)" > "$issue_path"
echo "issue_path=$issue_path" >> "$GITHUB_OUTPUT"
