---
sidebar_position: 300
---

# Safe update by Renovate

We assume that tools are updated by Renovate Automatically.
To decrease the burden, it is ideal that almost pull requests are merged automatically.

But it is danger to change infrastructure by `terraform apply` automatically.
So tfaction makes CI failed when the result of `terraform plan` includes any changes,
and pull requests are merged automatically only when the result of `terraform plan` includes no change.

![image](https://user-images.githubusercontent.com/13323303/150064670-2c6a646f-81f2-496f-b69a-873b6469593e.png)
