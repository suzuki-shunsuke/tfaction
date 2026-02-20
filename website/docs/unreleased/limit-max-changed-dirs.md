---
sidebar_position: 1900
---

# Limiting the Number of Root Modules Changed in a Single PR

You can limit the number of root modules that can be changed in a single PR.
Changing many root modules in the same PR can make reviews difficult, and every time you push a commit to fix a specific root module, CI runs unnecessarily for all root modules modified in the PR.
Setting a limit is not mandatory, but it can be beneficial.
By default, there is no limit.

```yaml
limit_changed_dirs:
  working_dirs: 5 # Maximum number of root modules
  modules: 5 # Maximum number of modules
```

If the limit is exceeded, CI will fail.

![](https://storage.googleapis.com/zenn-user-upload/c7e6753cd579-20260210.png)

If CI fails, either split the PR or increase the limit.
