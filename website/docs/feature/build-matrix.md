---
sidebar_position: 50
---

# Monorepo Support

tfaction supports Monorepo, which has multiple working directories in the same repository.

tfaction lists up target working directories and runs builds in parallel by [GitHub Actions build matrix](https://docs.github.com/en/actions/using-workflows/advanced-workflow-features#using-a-build-matrix).

![image](https://user-images.githubusercontent.com/13323303/151699474-b6cf9927-a0d1-4eb7-85fd-19504432362c.png)

Even if the number of working directories in the repository becomes huge, builds are run against only working directories which are changed in the pull request.
This is scalable.
