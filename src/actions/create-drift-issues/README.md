# create-drift-issues

Creates and closes drift detection issues, synchronizing them with the list of root modules.

## Steps

1. If drift detection is disabled, do nothing
2. Get the list of root modules
   - Exclude root modules where drift detection is disabled
3. Get the list of GitHub Issues via the GitHub API
4. Synchronize the root module list with the issue list
   - If an issue for a root module does not exist, create one
   - If a root module no longer exists, rename the issue and close it
