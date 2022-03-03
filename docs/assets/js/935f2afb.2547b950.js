"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[53],{1109:function(t){t.exports=JSON.parse('{"pluginId":"default","version":"current","label":"Next","banner":null,"badge":false,"className":"docs-version-current","isLast":true,"docsSidebars":{"tutorialSidebar":[{"type":"link","label":"tfaction","href":"/tfaction/docs/","docId":"overview"},{"type":"link","label":"Getting Started","href":"/tfaction/docs/getting-started","docId":"getting-started"},{"type":"category","label":"Feature","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"Support Monorepo with GitHub Actions build matrix","href":"/tfaction/docs/feature/build-matrix","docId":"feature/build-matrix"},{"type":"link","label":"Notify the result of terraform plan and apply with tfcmt","href":"/tfaction/docs/feature/tfcmt","docId":"feature/tfcmt"},{"type":"link","label":"Apply safely with Terraform Plan File","href":"/tfaction/docs/feature/plan-file","docId":"feature/plan-file"},{"type":"link","label":"Update related pull requests automatically when the base branch is updated","href":"/tfaction/docs/feature/auto-update-related-prs","docId":"feature/auto-update-related-prs"},{"type":"link","label":"Create a pull request automatically to handle the problem when apply failed","href":"/tfaction/docs/feature/follow-up-pr","docId":"feature/follow-up-pr"},{"type":"link","label":"Update dependencies with Renovate safely","href":"/tfaction/docs/feature/renovate","docId":"feature/renovate"},{"type":"link","label":"Scaffold working directory by GitHub Actions `workflow_dispatch` event","href":"/tfaction/docs/feature/scaffold-working-dir","docId":"feature/scaffold-working-dir"},{"type":"link","label":"tfmigrate","href":"/tfaction/docs/feature/tfmigrate","docId":"feature/tfmigrate"},{"type":"link","label":"Manage Terraform Modules","href":"/tfaction/docs/feature/module","docId":"feature/module"},{"type":"link","label":"Validate Terraform Plan Result with Conftest","href":"/tfaction/docs/feature/conftest","docId":"feature/conftest"},{"type":"link","label":"Support skipping `terraform plan` and `terraform apply` in case of pull request by Renovate","href":"/tfaction/docs/feature/support-skipping-terraform-renovate-pr","docId":"feature/support-skipping-terraform-renovate-pr"},{"type":"link","label":"Auto Fix .terraform.lock.hcl and Terraform Configuration","href":"/tfaction/docs/feature/auto-fix","docId":"feature/auto-fix"},{"type":"link","label":"Linters","href":"/tfaction/docs/feature/linter","docId":"feature/linter"},{"type":"link","label":"Support skipping creating pull requests","href":"/tfaction/docs/feature/skip-creating-pr","docId":"feature/skip-creating-pr"}]},{"type":"category","label":"Config","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"Set up","href":"/tfaction/docs/config/setup","docId":"config/setup"},{"type":"link","label":"How to add a working directory","href":"/tfaction/docs/config/add-working-directory","docId":"config/add-working-directory"},{"type":"link","label":"tfaction-root.yaml","href":"/tfaction/docs/config/tfaction-root-yaml","docId":"config/tfaction-root-yaml"},{"type":"link","label":"tfaction.yaml","href":"/tfaction/docs/config/tfaction-yaml","docId":"config/tfaction-yaml"},{"type":"link","label":"GitHub Access Token","href":"/tfaction/docs/config/github-token","docId":"config/github-token"},{"type":"link","label":"aqua.yaml","href":"/tfaction/docs/config/aqua","docId":"config/aqua"},{"type":"link","label":"Secrets Management","href":"/tfaction/docs/config/secret","docId":"config/secret"},{"type":"link","label":"gsutil authentication","href":"/tfaction/docs/config/gcp","docId":"config/gcp"}],"href":"/tfaction/docs/config/"},{"type":"category","label":"Actions","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"check-terraform-skip","href":"/tfaction/docs/actions/check-terraform-skip","docId":"actions/check-terraform-skip"},{"type":"link","label":"create-follow-up-pr","href":"/tfaction/docs/actions/create-follow-up-pr","docId":"actions/create-follow-up-pr"},{"type":"link","label":"create-scaffold-pr","href":"/tfaction/docs/actions/create-scaffold-pr","docId":"actions/create-scaffold-pr"},{"type":"link","label":"deploy-ssh-key","href":"/tfaction/docs/actions/deploy-ssh-key","docId":"actions/deploy-ssh-key"},{"type":"link","label":"export-aws-secrets-manager","href":"/tfaction/docs/actions/export-aws-secrets-manager","docId":"actions/export-aws-secrets-manager"},{"type":"link","label":"export-secrets","href":"/tfaction/docs/actions/export-secrets","docId":"actions/export-secrets"},{"type":"link","label":"get-global-config","href":"/tfaction/docs/actions/get-global-config","docId":"actions/get-global-config"},{"type":"link","label":"get-target-config","href":"/tfaction/docs/actions/get-target-config","docId":"actions/get-target-config"},{"type":"link","label":"list-targets-with-changed-files","href":"/tfaction/docs/actions/list-targets-with-changed-files","docId":"actions/list-targets-with-changed-files"},{"type":"link","label":"list-targets","href":"/tfaction/docs/actions/list-targets","docId":"actions/list-targets"},{"type":"link","label":"list-working-dirs","href":"/tfaction/docs/actions/list-working-dirs","docId":"actions/list-working-dirs"},{"type":"link","label":"release-module","href":"/tfaction/docs/actions/release-module","docId":"actions/release-module"},{"type":"link","label":"scaffold-module","href":"/tfaction/docs/actions/scaffold-module","docId":"actions/scaffold-module"},{"type":"link","label":"scaffold-tfmigrate","href":"/tfaction/docs/actions/scaffold-tfmigrate","docId":"actions/scaffold-tfmigrate"},{"type":"link","label":"scaffold-working-dir","href":"/tfaction/docs/actions/scaffold-working-dir","docId":"actions/scaffold-working-dir"},{"type":"link","label":"setup","href":"/tfaction/docs/actions/setup","docId":"actions/setup"},{"type":"link","label":"terraform-apply","href":"/tfaction/docs/actions/terraform-apply","docId":"actions/terraform-apply"},{"type":"link","label":"terraform-plan","href":"/tfaction/docs/actions/terraform-plan","docId":"actions/terraform-plan"},{"type":"link","label":"test-module","href":"/tfaction/docs/actions/test-module","docId":"actions/test-module"},{"type":"link","label":"test","href":"/tfaction/docs/actions/test","docId":"actions/test"},{"type":"link","label":"tfmigrate-apply","href":"/tfaction/docs/actions/tfmigrate-apply","docId":"actions/tfmigrate-apply"},{"type":"link","label":"tfmigrate-plan","href":"/tfaction/docs/actions/tfmigrate-plan","docId":"actions/tfmigrate-plan"}],"href":"/tfaction/docs/actions/"}]},"docs":{"actions/check-terraform-skip":{"id":"actions/check-terraform-skip","title":"check-terraform-skip","description":"Source code","sidebar":"tutorialSidebar"},"actions/create-follow-up-pr":{"id":"actions/create-follow-up-pr","title":"create-follow-up-pr","description":"Source code","sidebar":"tutorialSidebar"},"actions/create-scaffold-pr":{"id":"actions/create-scaffold-pr","title":"create-scaffold-pr","description":"Source code","sidebar":"tutorialSidebar"},"actions/deploy-ssh-key":{"id":"actions/deploy-ssh-key","title":"deploy-ssh-key","description":"Source code","sidebar":"tutorialSidebar"},"actions/export-aws-secrets-manager":{"id":"actions/export-aws-secrets-manager","title":"export-aws-secrets-manager","description":"Source code","sidebar":"tutorialSidebar"},"actions/export-secrets":{"id":"actions/export-secrets","title":"export-secrets","description":"Source code","sidebar":"tutorialSidebar"},"actions/get-global-config":{"id":"actions/get-global-config","title":"get-global-config","description":"Source code","sidebar":"tutorialSidebar"},"actions/get-target-config":{"id":"actions/get-target-config","title":"get-target-config","description":"Source code","sidebar":"tutorialSidebar"},"actions/index":{"id":"actions/index","title":"Actions","description":"Main Actions","sidebar":"tutorialSidebar"},"actions/list-targets":{"id":"actions/list-targets","title":"list-targets","description":"Source code","sidebar":"tutorialSidebar"},"actions/list-targets-with-changed-files":{"id":"actions/list-targets-with-changed-files","title":"list-targets-with-changed-files","description":"Source code","sidebar":"tutorialSidebar"},"actions/list-working-dirs":{"id":"actions/list-working-dirs","title":"list-working-dirs","description":"Source code","sidebar":"tutorialSidebar"},"actions/release-module":{"id":"actions/release-module","title":"release-module","description":"Create a GitHub Tag and Release for the versioning of Terraform Module.","sidebar":"tutorialSidebar"},"actions/scaffold-module":{"id":"actions/scaffold-module","title":"scaffold-module","description":"Scaffold Terraform Module pull request.","sidebar":"tutorialSidebar"},"actions/scaffold-tfmigrate":{"id":"actions/scaffold-tfmigrate","title":"scaffold-tfmigrate","description":"Scaffold tfmigrate migration pull request.","sidebar":"tutorialSidebar"},"actions/scaffold-working-dir":{"id":"actions/scaffold-working-dir","title":"scaffold-working-dir","description":"Scaffold a working directory","sidebar":"tutorialSidebar"},"actions/setup":{"id":"actions/setup","title":"setup","description":"Source code","sidebar":"tutorialSidebar"},"actions/terraform-apply":{"id":"actions/terraform-apply","title":"terraform-apply","description":"Source code","sidebar":"tutorialSidebar"},"actions/terraform-plan":{"id":"actions/terraform-plan","title":"terraform-plan","description":"Source code","sidebar":"tutorialSidebar"},"actions/test":{"id":"actions/test","title":"test","description":"Source code","sidebar":"tutorialSidebar"},"actions/test-module":{"id":"actions/test-module","title":"test-module","description":"Source code","sidebar":"tutorialSidebar"},"actions/tfmigrate-apply":{"id":"actions/tfmigrate-apply","title":"tfmigrate-apply","description":"Source code","sidebar":"tutorialSidebar"},"actions/tfmigrate-plan":{"id":"actions/tfmigrate-plan","title":"tfmigrate-plan","description":"Source code","sidebar":"tutorialSidebar"},"config/add-working-directory":{"id":"config/add-working-directory","title":"How to add a working directory","description":"* Create S3 Buckets//registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket","sidebar":"tutorialSidebar"},"config/aqua":{"id":"config/aqua","title":"aqua.yaml","description":"tfaction uses aqua, which is a Declarative CLI Version Manager written in Go.","sidebar":"tutorialSidebar"},"config/config":{"id":"config/config","title":"Configuration","description":"Configuration File","sidebar":"tutorialSidebar"},"config/gcp":{"id":"config/gcp","title":"gsutil authentication","description":"If you configure gcsbucketnameplanfile, tfaction stores Terraform Plan files at Google Cloud Storage with gsutil.","sidebar":"tutorialSidebar"},"config/github-token":{"id":"config/github-token","title":"GitHub Access Token","description":"tfaction requires GitHub Access Token.","sidebar":"tutorialSidebar"},"config/secret":{"id":"config/secret","title":"Secrets Management","description":"tfaction supports two types of secrets management.","sidebar":"tutorialSidebar"},"config/setup":{"id":"config/setup","title":"Set up","description":"AWS Account is required.","sidebar":"tutorialSidebar"},"config/tfaction-root-yaml":{"id":"config/tfaction-root-yaml","title":"tfaction-root.yaml","description":"* JSON Schema","sidebar":"tutorialSidebar"},"config/tfaction-yaml":{"id":"config/tfaction-yaml","title":"tfaction.yaml","description":"* JSON Schema","sidebar":"tutorialSidebar"},"feature/auto-fix":{"id":"feature/auto-fix","title":"Auto Fix .terraform.lock.hcl and Terraform Configuration","description":"* suzuki-shunsuke/github-action-terraform-init","sidebar":"tutorialSidebar"},"feature/auto-update-related-prs":{"id":"feature/auto-update-related-prs","title":"Update related pull requests automatically when the base branch is updated","description":"When terraform plan or tfmigrate plan are run in the target A,","sidebar":"tutorialSidebar"},"feature/build-matrix":{"id":"feature/build-matrix","title":"Support Monorepo with GitHub Actions build matrix","description":"tfaction supports Monorepo, which has multiple working directories in the same repository.","sidebar":"tutorialSidebar"},"feature/conftest":{"id":"feature/conftest","title":"Validate Terraform Plan Result with Conftest","description":"About Conftest, please see https://www.conftest.dev/ .","sidebar":"tutorialSidebar"},"feature/follow-up-pr":{"id":"feature/follow-up-pr","title":"Create a pull request automatically to handle the problem when apply failed","description":"Sometimes terraform apply fails even if terraform plan passed.","sidebar":"tutorialSidebar"},"feature/linter":{"id":"feature/linter","title":"Linters","description":"tfaction runs some linters in test Action.","sidebar":"tutorialSidebar"},"feature/module":{"id":"feature/module","title":"Manage Terraform Modules","description":"tfaction\'s required version: >= v0.5.0 #221","sidebar":"tutorialSidebar"},"feature/plan-file":{"id":"feature/plan-file","title":"Apply safely with Terraform Plan File","description":"Apply safely with Terraform Plan file created by Pull Request.","sidebar":"tutorialSidebar"},"feature/renovate":{"id":"feature/renovate","title":"Update dependencies with Renovate safely","description":"We assume that tools are updated by Renovate Automatically.","sidebar":"tutorialSidebar"},"feature/scaffold-working-dir":{"id":"feature/scaffold-working-dir","title":"Scaffold working directory by GitHub Actions `workflow_dispatch` event","description":"Execute GitHub Actions Workflow manually.","sidebar":"tutorialSidebar"},"feature/skip-creating-pr":{"id":"feature/skip-creating-pr","title":"Support skipping creating pull requests","description":"#202","sidebar":"tutorialSidebar"},"feature/support-skipping-terraform-renovate-pr":{"id":"feature/support-skipping-terraform-renovate-pr","title":"Support skipping `terraform plan` and `terraform apply` in case of pull request by Renovate","description":"#151 #153","sidebar":"tutorialSidebar"},"feature/tfcmt":{"id":"feature/tfcmt","title":"Notify the result of terraform plan and apply with tfcmt","description":"image","sidebar":"tutorialSidebar"},"feature/tfmigrate":{"id":"feature/tfmigrate","title":"tfmigrate","description":"About tfmigrate, please see https://github.com/minamijoyo/tfmigrate .","sidebar":"tutorialSidebar"},"getting-started":{"id":"getting-started","title":"Getting Started","description":"https://github.com/suzuki-shunsuke/tfaction-getting-started","sidebar":"tutorialSidebar"},"overview":{"id":"overview","title":"tfaction","description":"GitHub Actions collection for Opinionated Terraform Workflow","sidebar":"tutorialSidebar"}}}')}}]);