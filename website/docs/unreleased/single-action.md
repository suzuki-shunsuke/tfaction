---
sidebar_position: 600
---

# tfaction v2 is a Single Action

If you look at the workflow in Getting Started, you can see that tfaction calls the same action multiple times with different values for the `action` input.

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

In tfaction v2, the `action` input switches the behavior of the action.

- setup: Pre-processing
- terraform-init: `terraform init`
- plan: `terraform plan`
- apply: `terraform apply`

For convenience, we sometimes refer to them by their action input value, such as "setup action."

Using a single action improves both performance and maintainability.
