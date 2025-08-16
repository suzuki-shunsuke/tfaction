---
sidebar_position: 1230
description: Limit the number of changed directories in one pull request
---

# Limit changed directories

`tfaction >= v1.17.0`, [#2744](https://github.com/suzuki-shunsuke/tfaction/pull/2744)

You can limit the number of changed working directories and modules in one pull request.
By default, there is no limit.

![image](https://github.com/user-attachments/assets/3cb10063-e35f-4fab-b449-b708f3298b4d)

--

![modules](https://github.com/user-attachments/assets/71dcc073-31bd-4e6b-a24b-dee96bdddb61)

## Why is the limit necessary?

You shouldn't change many working directories and modules in one pull request.

- It's difficult to review many changes. You can miss unexpected changes
- CI becomes unstable
  - API rate limit
- Inefficient
  - If you fix a directory, you need to run CI on all changed directories
- Changes can be blocked due to a directory
  - If a directory has some trouble like drift, you can't merge the pull request

## How to limit

tfaction-root.yaml

```yaml
limit_changed_dirs:
  working_dirs: 5 # The maximum number of changed working directories in one pull request
  modules: 5 # The maximum number of changed modules in one pull request
```

If `working_dirs` and `modules` are less than `1`, they are ignored.

## How to resolve the failure

If CI fails due to this limit, you have two options:

1. Split changes to multiple pull requests
1. Fix tfaction-root.yaml and increase the limit. If you want to disable the limit, remove `limit_changed_dirs` or change `working_dirs` and `modules` to `0`

```yaml
limit_changed_dirs:
  working_dirs: 0 # no limit
  modules: 0 # no limit
```
