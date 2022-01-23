# Set up

AWS Account is required.

* [Configure AWS Identity Provider](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
* If you use Google Cloud Platform, setup [GCP Workload Identity Federation](https://github.com/google-github-actions/auth#setup)
* Prepare following files
  * [tfaction-root.yaml](config.md)
  * [tfaction.yaml](config.md)
  * [aqua.yaml](config.md)
  * templates of working directories
  * Renovate configuration
    * [example](https://github.com/suzuki-shunsuke/tfaction-example/blob/main/renovate.json5)
    * [Document](https://docs.renovatebot.com/configuration-options/)
* Create GitHub Personal Access Token or GitHub App
* Configure GitHub Actions Workflow using tfaction

Please see [How to add a working directory](add-working-directory.md) too.
