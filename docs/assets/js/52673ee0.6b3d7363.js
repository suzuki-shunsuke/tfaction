"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[216],{5631:e=>{e.exports=JSON.parse('{"version":{"pluginId":"default","version":"current","label":"Next","banner":null,"badge":false,"noIndex":false,"className":"docs-version-current","isLast":true,"docsSidebars":{"tutorialSidebar":[{"type":"link","label":"tfaction","href":"/tfaction/docs/","docId":"overview","unlisted":false},{"type":"category","label":"Feature","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"Support Monorepo with GitHub Actions build matrix","href":"/tfaction/docs/feature/build-matrix","docId":"feature/build-matrix","unlisted":false},{"type":"link","label":"Notify the result of terraform plan and apply with tfcmt","href":"/tfaction/docs/feature/tfcmt","docId":"feature/tfcmt","unlisted":false},{"type":"link","label":"Apply safely with Terraform Plan File","href":"/tfaction/docs/feature/plan-file","docId":"feature/plan-file","unlisted":false},{"type":"link","label":"Automatically update related pull requests when the remote state is updated","href":"/tfaction/docs/feature/auto-update-related-prs","docId":"feature/auto-update-related-prs","unlisted":false},{"type":"link","label":"Create a pull request automatically to handle the problem when apply failed","href":"/tfaction/docs/feature/follow-up-pr","docId":"feature/follow-up-pr","unlisted":false},{"type":"link","label":"Update dependencies with Renovate safely","href":"/tfaction/docs/feature/renovate","docId":"feature/renovate","unlisted":false},{"type":"link","label":"Scaffold working directory by GitHub Actions workflow_dispatch event","href":"/tfaction/docs/feature/scaffold-working-dir","docId":"feature/scaffold-working-dir","unlisted":false},{"type":"link","label":"tfmigrate","href":"/tfaction/docs/feature/tfmigrate","docId":"feature/tfmigrate","unlisted":false},{"type":"link","label":"Manage Terraform Modules","href":"/tfaction/docs/feature/module","docId":"feature/module","unlisted":false},{"type":"link","label":"Conftest","href":"/tfaction/docs/feature/conftest","docId":"feature/conftest","unlisted":false},{"type":"link","label":"Support skipping terraform plan and terraform apply in case of pull request by Renovate","href":"/tfaction/docs/feature/support-skipping-terraform-renovate-pr","docId":"feature/support-skipping-terraform-renovate-pr","unlisted":false},{"type":"link","label":"Auto Fix .terraform.lock.hcl and Terraform Configuration","href":"/tfaction/docs/feature/auto-fix","docId":"feature/auto-fix","unlisted":false},{"type":"link","label":"Drift Detection","href":"/tfaction/docs/feature/drift-detection","docId":"feature/drift-detection","unlisted":false},{"type":"link","label":"Linters","href":"/tfaction/docs/feature/linter","docId":"feature/linter","unlisted":false},{"type":"link","label":"Support skipping creating pull requests","href":"/tfaction/docs/feature/skip-creating-pr","docId":"feature/skip-creating-pr","unlisted":false},{"type":"link","label":"Destroy resources","href":"/tfaction/docs/feature/destroy","docId":"feature/destroy","unlisted":false},{"type":"link","label":"Use a Terraform compatible tool","href":"/tfaction/docs/feature/use-terraform-compatible-tool","docId":"feature/use-terraform-compatible-tool","unlisted":false},{"type":"link","label":"Run CI on working directories that depend on a updated local path Module","href":"/tfaction/docs/feature/local-path-module","docId":"feature/local-path-module","unlisted":false},{"type":"link","label":"Generate code by terraform plan -generate-config-out","href":"/tfaction/docs/feature/generate-config-out","docId":"feature/generate-config-out","unlisted":false},{"type":"link","label":"Generate document using terraform-docs","href":"/tfaction/docs/feature/terraform-docs","docId":"feature/terraform-docs","unlisted":false}]},{"type":"category","label":"Config","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"Set up","href":"/tfaction/docs/config/setup","docId":"config/setup","unlisted":false},{"type":"link","label":"How to add a working directory","href":"/tfaction/docs/config/add-working-directory","docId":"config/add-working-directory","unlisted":false},{"type":"link","label":"tfaction-root.yaml","href":"/tfaction/docs/config/tfaction-root-yaml","docId":"config/tfaction-root-yaml","unlisted":false},{"type":"link","label":"tfaction.yaml","href":"/tfaction/docs/config/tfaction-yaml","docId":"config/tfaction-yaml","unlisted":false},{"type":"link","label":"GitHub Access Token","href":"/tfaction/docs/config/github-token","docId":"config/github-token","unlisted":false},{"type":"link","label":"aqua.yaml","href":"/tfaction/docs/config/aqua","docId":"config/aqua","unlisted":false},{"type":"link","label":"Secrets Management","href":"/tfaction/docs/config/secret","docId":"config/secret","unlisted":false},{"type":"link","label":"Set Terraform CLI options with the environment variable","href":"/tfaction/docs/config/terraform-cli-options","docId":"config/terraform-cli-options","unlisted":false},{"type":"link","label":"Validate Terraform Providers using tfprovidercheck","href":"/tfaction/docs/config/tfprovidercheck","docId":"config/tfprovidercheck","unlisted":false},{"type":"link","label":"Prevent workflows from being tampered using pull_request_target","href":"/tfaction/docs/config/pull_request_target","docId":"config/pull_request_target","unlisted":false}],"href":"/tfaction/docs/config/"}]},"docs":{"config/add-working-directory":{"id":"config/add-working-directory","title":"How to add a working directory","description":"* Create S3 Buckets or Google Cloud Storage Buckets","sidebar":"tutorialSidebar"},"config/aqua":{"id":"config/aqua","title":"aqua.yaml","description":"tfaction uses aqua, which is a Declarative CLI Version Manager written in Go.","sidebar":"tutorialSidebar"},"config/config":{"id":"config/config","title":"Configuration","description":"Configuration File","sidebar":"tutorialSidebar"},"config/github-token":{"id":"config/github-token","title":"GitHub Access Token","description":"tfaction requires a GitHub Access Token.","sidebar":"tutorialSidebar"},"config/pull_request_target":{"id":"config/pull_request_target","title":"Prevent workflows from being tampered using pull_request_target","description":"Terraform Workflows requires strong permissions to manage resources, so it\'s important to prevent workflows from being tampered in terms of security.","sidebar":"tutorialSidebar"},"config/secret":{"id":"config/secret","title":"Secrets Management","description":"tfaction supports two types of secrets management.","sidebar":"tutorialSidebar"},"config/setup":{"id":"config/setup","title":"Set up","description":"As of tfaction v0.7.0, probably AWS or Google Cloud Account isn\'t mandatory.","sidebar":"tutorialSidebar"},"config/terraform-cli-options":{"id":"config/terraform-cli-options","title":"Set Terraform CLI options with the environment variable","description":"#311","sidebar":"tutorialSidebar"},"config/tfaction-root-yaml":{"id":"config/tfaction-root-yaml","title":"tfaction-root.yaml","description":"* JSON Schema","sidebar":"tutorialSidebar"},"config/tfaction-yaml":{"id":"config/tfaction-yaml","title":"tfaction.yaml","description":"* JSON Schema","sidebar":"tutorialSidebar"},"config/tfprovidercheck":{"id":"config/tfprovidercheck","title":"Validate Terraform Providers using tfprovidercheck","description":"This is not a feature of tfaction, but we describe how to use tfprovidercheck with tfaction.","sidebar":"tutorialSidebar"},"feature/auto-fix":{"id":"feature/auto-fix","title":"Auto Fix .terraform.lock.hcl and Terraform Configuration","description":"* suzuki-shunsuke/github-action-terraform-init","sidebar":"tutorialSidebar"},"feature/auto-update-related-prs":{"id":"feature/auto-update-related-prs","title":"Automatically update related pull requests when the remote state is updated","description":"When terraform plan or tfmigrate plan is run in target A,","sidebar":"tutorialSidebar"},"feature/build-matrix":{"id":"feature/build-matrix","title":"Support Monorepo with GitHub Actions build matrix","description":"tfaction supports Monorepo, which has multiple working directories in the same repository.","sidebar":"tutorialSidebar"},"feature/conftest":{"id":"feature/conftest","title":"Conftest","description":"Conftest support was improved at tfaction v1.8.0.","sidebar":"tutorialSidebar"},"feature/destroy":{"id":"feature/destroy","title":"Destroy resources","description":"#1291 #1343 tfaction >= v1.0.0","sidebar":"tutorialSidebar"},"feature/drift-detection":{"id":"feature/drift-detection","title":"Drift Detection","description":"Check the drift periodically and track it using GitHub Issues","sidebar":"tutorialSidebar"},"feature/follow-up-pr":{"id":"feature/follow-up-pr","title":"Create a pull request automatically to handle the problem when apply failed","description":"Sometimes terraform apply fails even if terraform plan passed.","sidebar":"tutorialSidebar"},"feature/generate-config-out":{"id":"feature/generate-config-out","title":"Generate code by terraform plan -generate-config-out","description":"#1860 #1870 v1.7.0","sidebar":"tutorialSidebar"},"feature/linter":{"id":"feature/linter","title":"Linters","description":"tfaction runs some linters in test and test-module actions.","sidebar":"tutorialSidebar"},"feature/local-path-module":{"id":"feature/local-path-module","title":"Run CI on working directories that depend on a updated local path Module","description":"tfaction >= v1.3.0 #1528","sidebar":"tutorialSidebar"},"feature/module":{"id":"feature/module","title":"Manage Terraform Modules","description":"tfaction\'s required version: >= v0.5.0 #221","sidebar":"tutorialSidebar"},"feature/plan-file":{"id":"feature/plan-file","title":"Apply safely with Terraform Plan File","description":"Apply safely with Terraform Plan file created by Pull Request.","sidebar":"tutorialSidebar"},"feature/renovate":{"id":"feature/renovate","title":"Update dependencies with Renovate safely","description":"We assume that tools are updated by Renovate Automatically.","sidebar":"tutorialSidebar"},"feature/scaffold-working-dir":{"id":"feature/scaffold-working-dir","title":"Scaffold working directory by GitHub Actions workflow_dispatch event","description":"When you add a new working directory, you can scaffold the directory by GitHub Actions.","sidebar":"tutorialSidebar"},"feature/skip-creating-pr":{"id":"feature/skip-creating-pr","title":"Support skipping creating pull requests","description":"#202","sidebar":"tutorialSidebar"},"feature/support-skipping-terraform-renovate-pr":{"id":"feature/support-skipping-terraform-renovate-pr","title":"Support skipping terraform plan and terraform apply in case of pull request by Renovate","description":"#151 #153","sidebar":"tutorialSidebar"},"feature/terraform-docs":{"id":"feature/terraform-docs","title":"Generate document using terraform-docs","description":"#1859 #1878 v1.8.0","sidebar":"tutorialSidebar"},"feature/tfcmt":{"id":"feature/tfcmt","title":"Notify the result of terraform plan and apply with tfcmt","description":"image","sidebar":"tutorialSidebar"},"feature/tfmigrate":{"id":"feature/tfmigrate","title":"tfmigrate","description":"About tfmigrate, please see https://github.com/minamijoyo/tfmigrate .","sidebar":"tutorialSidebar"},"feature/use-terraform-compatible-tool":{"id":"feature/use-terraform-compatible-tool","title":"Use a Terraform compatible tool","description":"#1554 tfaction >= v1.2.0","sidebar":"tutorialSidebar"},"overview":{"id":"overview","title":"tfaction","description":"Who uses tfaction? | Release Note | MIT LICENSE","sidebar":"tutorialSidebar"}}}}')}}]);