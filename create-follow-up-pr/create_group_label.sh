#!/usr/bin/env bash

set -euo pipefail

if [ "${TFACTION_DEBUG:-}" = true ]; then
	set -x
fi

if [ "$FOLLOW_UP_PR_GROUP_LABEL_ENABLED" = true ]; then
	if ! group_label=$(grep -E "${FOLLOW_UP_PR_GROUP_LABEL_PREFIX}[0-9]+" "$CI_INFO_TEMP_DIR/labels.txt"); then
		group_label="${FOLLOW_UP_PR_GROUP_LABEL_PREFIX}$CI_INFO_PR_NUMBER"
		gh label create "$group_label" || :
        echo "label=$group_label" >> "$GITHUB_OUTPUT"
	fi
fi
