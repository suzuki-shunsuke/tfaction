---
sidebar_position: 3500
---

# Safe Apply Using Plan Files

This is a built-in feature of tfaction and requires no action from users.

tfaction runs terraform plan on pull requests and terraform apply when the PR is merged.
In Terraform, you can generate a plan file during terraform plan and pass it to terraform apply to ensure the exact same changes reviewed in plan are applied.

```sh
terraform plan -out=plan.tfplan
terraform apply plan.tfplan
```

Without a plan file, there is a risk that terraform apply produces different results than what was reviewed during terraform plan.
tfaction uploads the plan file to GitHub Artifacts and downloads it during terraform apply.
Since GitHub Artifacts is used, there is no dependency on S3, GCS, or other external storage. Additionally, uploaded plan files cannot be tampered with after the fact, making this approach secure.
