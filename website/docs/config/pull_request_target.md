---
sidebar_position: 700
---

# Prevent workflows from being tampered using `pull_request_target`

Terraform Workflows requires strong permissions to manage resources, so it's important to prevent workflows from being tampered in terms of security.
So we recommend using `pull_request_target` event instead of `pull_request` event.
For the detail, please see the blog post.

[Secure GitHub Actions by pull_request_target | dev.to](https://dev.to/suzukishunsuke/secure-github-actions-by-pullrequesttarget-641)

To use `pull_request_target`, you need to fix workflow files.

1. Fix `actions/checkout`'s `ref`
1. Set the merge commit hash to the environment variables `GH_COMMENT_SHA1` and `TFCMT_SHA` for github-comment and tfcmt
1. Fix OIDC settings
1. Stop executing feature branches' scripts and actions

Please see the above blog post and [tfaction-example](https://github.com/suzuki-shunsuke/tfaction-example).

[ci: use pull_request_target | suzuki-shunsuke/tfaction-example#2056](https://github.com/suzuki-shunsuke/tfaction-example/pull/2056)
