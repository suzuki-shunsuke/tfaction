# update-drift-issue

Updates the specified drift issue based on plan or apply results.
Closes the issue if plan or apply succeeds, and reopens it if they fail.

This is an independent action to ensure it always runs in apply jobs and drift detection jobs.

## Environment variables

- `TFACTION_SKIP_TERRAFORM`: If `true`, the issue isn't closed. Set it in apply jobs so that skipping apply doesn't close the drift issue

Unlike plan and apply, this step must not be gated with `skip_terraform`.
It has to keep running with `if: always()` so that a failure elsewhere in the job still comments on the drift issue and reopens it.
`TFACTION_SKIP_TERRAFORM` only suppresses closing the issue.
