# create-scaffold-pr

Creates a PR to add a root module. Run this after `scaffold-working-dir`.
If `skip_create_pr` is enabled, only a commit and branch are created without creating a PR.

## Steps

1. Get the list of files to commit using `git ls-files`
2. Create the PR
