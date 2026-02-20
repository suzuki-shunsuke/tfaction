# get-or-create-drift-issue

Creates a drift issue for a specific root module if one does not already exist.
Exports the environment variables `TFACTION_DRIFT_ISSUE_NUMBER` and `TFACTION_DRIFT_ISSUE_STATE`.
If drift detection is disabled, does nothing.
