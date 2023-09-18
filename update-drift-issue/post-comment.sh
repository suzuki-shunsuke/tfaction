#!/usr/bin/env bash
# Get the latest issue comment and check if the body includes the GitHub Actions Run URL.
# If the body includes it, do nothing.
# Otherwise, post a comment to clarify why the issue is reopened.

set -euo pipefail

# shellcheck disable=SC2016
body=$(gh api graphql -q '.data.repository.issue.comments.nodes[0].body' -F owner="$TFACTION_DRIFT_ISSUE_REPO_OWNER" -F name="$TFACTION_DRIFT_ISSUE_REPO_NAME" -F issueNumber="$TFACTION_DRIFT_ISSUE_NUMBER" -f query='
	query($name: String!, $owner: String!, $issueNumber: Int!) {
		repository(owner: $owner, name: $name) {
			issue(number: $issueNumber) {
				comments(last: 1) {
          nodes {
            body 
          }
				}
			}
		}
	}
')

job_url="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"

if [[ "$body" =~ .*$job_url.* ]]; then
	exit 0
fi

github-comment post \
	-config "${GITHUB_ACTION_PATH}/github-comment.yaml" \
	-k notification
