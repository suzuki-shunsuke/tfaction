# Create a pull request automatically to handle the problem when apply failed

Sometimes `terraform apply` fails even if `terraform plan` passed.
In that case, tfaction automatically creates a pull request to fix the failure.

If the problem would be solved by running `terraform apply` again,
please merge the created pull request.

If any code fix is needed, please add commits to the created pull request and merge it.
