#!/usr/bin/env bash

set -euo pipefail

created=false
if ! [ -f README.md ]; then
	created=true
fi

tempfile=$(mktemp)

terraform-docs -v

if ! github-comment exec \
	-config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
	-var "tfaction_target:${TFACTION_TARGET}" \
	-k terraform-docs \
	-- terraform-docs . > "$tempfile"; then
	cat "$tempfile"
	rm "$tempfile"
	exit 1
fi

if ! grep -q '<!-- BEGIN_TF_DOCS -->' README.md; then
	# output.file is disabled
	cat "$tempfile" > README.md
fi

rm "$tempfile"

if [ "$created" = "true" ] || ! git diff --quiet README.md; then
	if [ "$GITHUB_EVENT_NAME" != pull_request ] && [ "$GITHUB_EVENT_NAME" != pull_request_target ]; then
		echo "::error ::Please generate Module's README.md with terraform-docs."
		exit 1
	fi
	github-comment exec \
		-config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
		-var "tfaction_target:${TFACTION_TARGET}" \
		-- ghcp commit -r "$GITHUB_REPOSITORY" -b "$GITHUB_HEAD_REF" \
		-m "docs($TFACTION_TARGET): generate Terraform Module document by terraform-docs" \
		-C "$GITHUB_WORKSPACE" "$TFACTION_TARGET/README.md"
	exit 1
fi
