# pick-out-drift-issues

Retrieves a list of root modules and their issues for periodic drift detection checks.
After retrieving the list with this action, subsequent matrix jobs perform the checks.

When there are many root modules, checking all of them at once is impractical, so this action selects the N root modules whose last check time is the oldest.
Since check results are recorded in the issue each time, the last check time is managed by the drift issue's updated date.
Additionally, only root modules whose last check time is more than N days before the current time are included.

## Outputs

- `has_issues`: `true` or `false`. `false` if no issues were picked out
- `issues`: List of picked out issues

```json
[
  {
    "number": 12345,
    "title": "Issue Title",
    "target": "Root module target",
    "state": "closed (issue state)",
    "runs_on": "runs-on for the subsequent drift detection job"
  }
]
```

If drift detection is disabled, returns empty results:

- `has_issues`: `false`
- `issues`: `[]`

## Steps

1. Retrieve issues via GitHub API where the title contains `Terraform Drift` and the updated date is older than the threshold
   - Extract the root module target from the title
