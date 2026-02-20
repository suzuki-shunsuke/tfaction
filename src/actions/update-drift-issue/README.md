# update-drift-issue

Updates the specified drift issue based on plan or apply results.
Closes the issue if plan or apply succeeds, and reopens it if they fail.

This is an independent action to ensure it always runs in apply jobs and drift detection jobs.
