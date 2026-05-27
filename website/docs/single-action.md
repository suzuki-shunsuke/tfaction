---
sidebar_position: 600
---

# tfaction v2 is a Single Action

Looking at the workflow from [Getting Started](./getting-started), you can see that tfaction calls the same action multiple times with different values for the `action` input.

```yaml
- uses: suzuki-shunsuke/tfaction@latest
  with:
    action: setup
# ...
- uses: suzuki-shunsuke/tfaction@latest
  with:
    action: terraform-init
# ...
- uses: suzuki-shunsuke/tfaction@latest
  with:
    action: plan
```

In tfaction v2, the `action` input switches the behavior of the action:

- `setup`: Pre-processing
- `terraform-init`: `terraform init`
- `plan`: `terraform plan`
- `apply`: `terraform apply`

For convenience, we sometimes refer to each behavior by its `action` input value (e.g., "setup action").

Using a single action improves both performance and maintainability.
