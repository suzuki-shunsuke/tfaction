#!/usr/bin/env bash

set -eu
set -o pipefail

gh search issues \
	--json state,number \
	-L 1 \
	--repo "$REPO" \
	--sort updated \
	--order asc \
	> issues.json
cat issues.json
length=$(jq length < issues.json)
echo "length=$length" >> "$GITHUB_OUTPUT"
if [ 1 -eq "$length" ]; then
	echo "state=$(jq -r ".[0].state" < issues.json)" >> "$GITHUB_OUTPUT"
	echo "number=$(jq -r ".[0].number" < issues.json)" >> "$GITHUB_OUTPUT"
fi

# TODO get target
