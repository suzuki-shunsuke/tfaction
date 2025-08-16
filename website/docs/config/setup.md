---
sidebar_position: 100
---

# Set up

:::info
As of tfaction v0.7.0, probably AWS or Google Cloud Account isn't mandatory.
:::

- If you use AWS, [Configure AWS Identity Provider](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- If you use Google Cloud, setup [GCP Workload Identity Federation](https://github.com/google-github-actions/auth#setup)
- Prepare following files
  - [tfaction-root.yaml](/config/tfaction-root-yaml)
  - [tfaction.yaml](/config/tfaction-yaml)
  - [aqua.yaml](/config/aqua)
  - templates of working directories
  - Renovate configuration
    - [example](https://github.com/suzuki-shunsuke/tfaction-example/blob/main/renovate.json5)
    - [Document](https://docs.renovatebot.com/configuration-options/)
- Create GitHub Personal Access Token or GitHub App
- Configure GitHub Actions Workflow using tfaction

Please see [How to add a working directory](add-working-directory.md) too.
