---
sidebar_position: 1000
---

# Skip creating pull requests

[#202](https://github.com/suzuki-shunsuke/tfaction/issues/202)

tfaction supports creating some types of pull requests.

- [Follow up Pull Request](follow-up-pr.md)
- [Scaffold working directory Pull Request](scaffold-working-dir.md)
- [Scaffold tfmigrate migration Pull Request](tfmigrate.md#scaffold-migration-pull-request)
- [Scaffold Terraform Module Pull Request](module.md)

They are really useful, but these pull requests are created by GitHub App so you can pass [1 approval Required](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches#require-pull-request-reviews-before-merging) by approving your changes by yourself.
To solve the problem, tfaction provides the setting `skip_create_pr` in `tfaction-root.yaml`.

```yaml
skip_create_pr: true # By default, this is false
```

If this is true, tfaction creates a feature branch and guides how to create a pull request but doesn't create a pull request.
Please see the tfaction's message and create a pull request by [gh pr create](https://cli.github.com/manual/gh_pr_create) command.

## Follow up pull request

[Follow up Pull Request](follow-up-pr.md)

![image](https://user-images.githubusercontent.com/13323303/155868691-4a70167c-bf27-4e14-93da-99d72dd39649.png)

## Scaffold working directory

[Scaffold working directory Pull Request](scaffold-working-dir.md)

![image](https://user-images.githubusercontent.com/13323303/155868783-e5131df4-5291-4f94-993d-dfaf46bdc03d.png)

--

![image](https://user-images.githubusercontent.com/13323303/155868807-3e5a590f-13ef-4c90-ad47-d92102b46e00.png)

## Scaffold tfmigrate migration

[Scaffold tfmigrate migration Pull Request](tfmigrate.md#scaffold-migration-pull-request)

![image](https://user-images.githubusercontent.com/13323303/155868841-d473d487-7b86-4d01-99ce-ad2da1bdad72.png)

--

![image](https://user-images.githubusercontent.com/13323303/155868848-98518c6f-227a-430d-917e-bc366ba48048.png)

## Scaffold Terraform Module

[Scaffold Terraform Module Pull Request](module.md)

![image](https://user-images.githubusercontent.com/13323303/156073236-2f1a39d4-9e6e-41a2-bf6c-618b408cba58.png)

--

![image](https://user-images.githubusercontent.com/13323303/156073275-8a72aaa9-ce19-4e02-b780-f42bf1164441.png)
