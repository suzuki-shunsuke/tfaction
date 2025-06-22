#!/usr/bin/env bash

set -euo pipefail

if [ "${TFACTION_DEBUG:-}" = true ]; then
	set -x
fi

pwd=$PWD

created=false
if ! [ -f README.md ]; then
	created=true
fi

tempfile=$(mktemp)

# config in service directory
# .terraform-docs.yml
# .config/.terraform-docs.yml
# 1. root of module directory
# 2. .config/ folder at root of module directory (since v0.15.0)
# 3. current directory
# 4. .config/ folder at current directory (since v0.15.0)
# global config
# repository root .terraform-docs.yml
# repository root .config/.terraform-docs.yml
# default config: markdown

terraform-docs -v

config=""
for file in .terraform-docs.yml .terraform-docs.yaml .config/.terraform-docs.yml .config/.terraform-docs.yaml; do
	if [ -f "$file" ]; then
		config="$file"
		break
	fi
done

if [ -z "$config" ]; then
	for file in .terraform-docs.yml .terraform-docs.yaml .config/.terraform-docs.yml .config/.terraform-docs.yaml; do
		if [ -f "$pwd/$file" ]; then
			config="$pwd/$file"
			break
		fi
	done
fi

opts=markdown
if [ -n "$config" ]; then
	opts="-c $config"
fi

# shellcheck disable=SC2086
if ! github-comment exec \
	-config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
	-var "tfaction_target:${TFACTION_TARGET}" \
	-k terraform-docs \
	-- terraform-docs $opts . >"$tempfile"; then
	cat "$tempfile"
	rm "$tempfile"
	exit 1
fi

if grep -q 'Available Commands:' "$tempfile"; then
	echo "::error ::.terraform-docs.yml is required"
	exit 1
fi

if ! grep -q '<!-- BEGIN_TF_DOCS -->' README.md; then
	# output.file is disabled
	cat "$tempfile" >README.md
fi

rm "$tempfile"

if [ "$created" = "true" ] || ! git diff --quiet README.md; then
	if [ "$GITHUB_EVENT_NAME" != pull_request ] && [ "$GITHUB_EVENT_NAME" != pull_request_target ]; then
		echo "::error ::Please generate Module's README.md with terraform-docs."
		exit 1
	fi
	echo "changed=true" >>"$GITHUB_OUTPUT"
fi
