---
sidebar_position: 150
---

# Follow-up pull requests

Sometimes `terraform apply` fails even if `terraform plan` passed.
In that case, tfaction automatically creates a pull request with an empty commit to fix the failure.

![image](https://user-images.githubusercontent.com/13323303/151699230-1c109a57-47d1-4c3b-9c3a-4dfec786a043.png)

![image](https://user-images.githubusercontent.com/13323303/151699142-6d19cd51-eac5-4f69-bfe5-7920df69edc6.png)

If the problem would be solved by running `terraform apply` again,
please merge the created pull request.

If any code fix is needed, please add commits to the created pull request and merge it.

Pull Requests are created per failed job.
For example, if two jobs failed, two pull requests would be created.

## .tfaction/failed-prs

[#1799](https://github.com/suzuki-shunsuke/tfaction/issues/1799) [#1801](https://github.com/suzuki-shunsuke/tfaction/pull/1801)

As of tfaction [v1.6.0](https://github.com/suzuki-shunsuke/tfaction/releases/tag/v1.6.0), the behavior of this feature was changed.
tfaction creates a file `.tfaction/failed-prs` in working directories to create follow up pull requests.

e.g.

```
# This file is created and updated by tfaction for follow up pull requests.
# You can remove this file safely.
https://github.com/suzuki-shunsuke/terraform-example/pull/1
```

## :bulb: Skip creating pull requests

If you don't want to create pull requests by GitHub App, please see [Support skipping creating pull requests](skip-creating-pr.md).
