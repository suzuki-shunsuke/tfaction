#!/usr/bin/env bash

set -euo pipefail

if install_path=$(command -v terraform-config-inspect); then
	echo "install_path=$install_path" >> "$GITHUB_OUTPUT"
	exit 0
fi

GOBIN=${GITHUB_ACTION_PATH}/bin
install_path=${GOBIN}/terraform-config-inspect
github-comment exec -- go install github.com/hashicorp/terraform-config-inspect@a34142ec2a72dd916592afd3247dd354f1cc7e5c
echo "install_path=$install_path" >> "$GITHUB_OUTPUT"
