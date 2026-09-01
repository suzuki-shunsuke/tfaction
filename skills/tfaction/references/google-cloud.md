---
sidebar_position: 1400
---

# Configuration for Google Cloud

This page explains the configuration for using the Google Cloud Provider and GCS Backend.
If you do not use these, you can skip this page.

When using these, you need to authenticate before running terraform init.

## IAM Role Configuration

Configure the IAM Role to assume in tfaction-root.yaml or tfaction.yaml.

```yaml
target_groups:
  - working_directory: ""
    terraform_plan_config:
      gcp_service_account: terraform-plan@gke-getting-started-277012.iam.gserviceaccount.com
      gcp_workload_identity_provider: projects/750433540665/locations/global/workloadIdentityPools/my-pool/providers/github-actions-terraform-plan
      gcp_access_token_scopes: "https://www.googleapis.com/auth/cloud-platform, https://www.googleapis.com/auth/userinfo.email, https://www.googleapis.com/auth/apps.groups.settings, https://www.googleapis.com/auth/admin.directory.group"
    terraform_apply_config:
      gcp_service_account: terraform-apply@gke-getting-started-277012.iam.gserviceaccount.com
      gcp_workload_identity_provider: projects/750433540665/locations/global/workloadIdentityPools/my-pool/providers/github-actions-terraform-apply
      gcp_access_token_scopes: "https://www.googleapis.com/auth/cloud-platform, https://www.googleapis.com/auth/userinfo.email, https://www.googleapis.com/auth/apps.groups.settings, https://www.googleapis.com/auth/admin.directory.group"
```

Because you can use separate Service Accounts for terraform plan and apply, you can use a read-only Service Account for plan and a Service Account with stronger permissions for apply.

In tfaction v1, the `setup` action executed [google-github-actions/auth](https://github.com/google-github-actions/auth).
Starting from v2, it is no longer executed automatically, so you need to run it yourself.

## OIDC

You can assume a Service Account from GitHub Actions using OIDC.
This is not directly related to tfaction, so the details are omitted here.

https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-google-cloud-platform
