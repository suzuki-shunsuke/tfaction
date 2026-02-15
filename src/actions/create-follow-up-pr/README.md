# create-follow-up-pr

Creates a PR to update the same root module when apply fails, to assist in resolving the failure.
If `skip_create_pr` is enabled, only a commit and branch are created without creating a PR.

## Steps

1. If group label is enabled, create the group label and add it to the PR
2. Create or update `.tfaction/failed-prs`
3. If `TFACTION_JOB_TYPE` is `tfmigrate`, add the tfmigrate label to the new PR
   - This ensures tfmigrate runs on the new PR
4. Create the follow-up PR
5. Comment the follow-up PR URL on the original PR
   - When using Securefix Action to create the PR, the PR is created asynchronously so the URL is unknown and cannot be commented
