---
sidebar_position: 2300
---

# Limiting the Number of Root Modules Changed in a Single PR

You can limit the number of root modules that can be changed in a single PR.
Changing many root modules in the same PR makes reviews difficult, and every time you push a commit to fix a specific root module, CI runs unnecessarily for all other changed root modules in the PR.
Setting an upper limit is not mandatory, but it can be beneficial.
By default, there is no limit.

```yaml
limit_changed_dirs:
  working_dirs: 5 # Upper limit for root modules
  modules: 5 # Upper limit for modules
```

If the limit is exceeded, CI will fail.

![](https://storage.googleapis.com/zenn-user-upload/c7e6753cd579-20260210.png)

If CI fails due to exceeding the limit, either split the PR or increase the limit.
