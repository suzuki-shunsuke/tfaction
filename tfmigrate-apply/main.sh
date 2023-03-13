#!/usr/bin/env bash

set -eu
set -o pipefail

set +e
github-comment exec \
	--config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
	-var "tfaction_target:$TFACTION_TARGET" \
	-k tfmigrate-apply -- \
		tfmigrate apply
code=$?
set -e

prs_txt=$(mktemp)
github-comment exec -config "${GITHUB_ACTION_PATH}/github-comment.yaml" -var "tfaction_target:$TFACTION_TARGET" -- gh pr list --json number -L 100 -l "$TFACTION_TARGET" -q ".[].number" | tee "$prs_txt"

if [ "$UPDATE_ONLY_ONE_PR" = "true" ] && [ "$(wc -l < "$prs_txt")" -gt 1 ]; then
	head -n 1 "$prs_txt" | bash "${GITHUB_ACTION_PATH}/update_branch.sh"
	while read -r pr_number; do
		if [ "$CI_INFO_PR_NUMBER" = "$pr_number" ]; then
			# To prevent infinite loop
			continue
		fi
		echo "===> Post a comment to PR $pr_number" >&2
		github-comment post -pr "$pr_number" -config "${GITHUB_ACTION_PATH}/github-comment.yaml" -var "pr_number:$CI_INFO_PR_NUMBER" -var "tfaction_target:$TFACTION_TARGET" -k rerun-plan
	done < <(tail -n +2 "$prs_txt")
	exit 0
fi

bash "${GITHUB_ACTION_PATH}/update_branch.sh" < "$prs_txt"

exit "$code"
