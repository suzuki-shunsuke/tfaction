---
sidebar_position: 3000
---

# v2 Release Note

## Summary

tfaction v2 includes various breaking changes, and all users will need to modify their code.
See the upgrade guide for details.
tfaction, which was previously a collection of many actions, has been entirely rewritten as a single JavaScript Action. Different features such as plan, apply, and test are now selected via the `action` input.
This significantly improves both performance and maintainability.
Additionally, it includes feature enhancements such as the introduction of a template engine, support for Reviewdog customization, and the official release of the target replacement feature.

## Improvements

- Performance improvements
- Improved maintainability
- Support for customizing Reviewdog settings
- Official release of replace_target
- Automatic aqua installation
- Support for customizing PR title, body, and comment in PR scaffolding
- Glob support in target_groups.working_directory
  - Enables more flexible configuration
- Automatic fixes via tflint --fix enabled by default
- Addition of `github_token_for_github_provider` input for passing a GitHub Access Token for the GitHub Provider
- Automatic PR branch update when changes are detected on the base branch by comparing root modules between base and feature branches

### Performance Improvements

Previously, all `suzuki-shunsuke/tfaction/*` actions except `suzuki-shunsuke/tfaction/js` were Composite Actions.
In v2, they have been consolidated into a single JavaScript Action: `suzuki-shunsuke/tfaction`.
This significantly reduces the time spent downloading actions and greatly shortens the processing time of the `Set up job` step, which runs at the beginning of every GitHub Actions job.
While results vary by environment, we observed a reduction of approximately 20 to 40 seconds in our environment.
Additionally, rewriting everything as a single JavaScript Action eliminates overhead between Composite Action steps and provides minor performance improvements by replacing external command execution with JavaScript.

The removal of AWS and Google Cloud authentication is also related to performance improvements.
Due to how GitHub Actions works, actions are downloaded during `Set up job` even if the step running the action is skipped.
This means that even when AWS or Google Cloud authentication is not needed, the action is still downloaded, which is wasteful.
Embedding the functionality of `aws-actions/configure-aws-credentials` and `google-github-actions/auth` into tfaction's TypeScript would avoid the download, but we decided against it due to the maintenance burden.
Instead, users now run these actions themselves as needed.
This can also be seen as enabling more flexible authentication handling than before.

### Improved Maintainability

Rewriting all code in TypeScript has improved maintainability.
Previously, with the Composite Action implementation, data was passed between steps using inputs/outputs and environment variables.
However, the type system for these interfaces is extremely limited.
Only the string type is supported, requiring data serialization, and it is difficult to catch mistakes in input/output names or types before execution.
Additionally, there are size limits on data, requiring the use of files for large data.

On the other hand, when everything is written in TypeScript, its powerful type system and editor integration make it easy to catch mistakes quickly, provide code completion, and make unit testing straightforward.

### Support for Customizing Reviewdog Settings

Results from trivy and tflint are reported via reviewdog, and those settings can now be customized.
The most significant change is that `-filter-mode` can now be modified.
Previously, `--filter-mode nofilter` was fixed, which meant code not changed in the PR was also included.
By setting `--filter-mode` to `added`, only code changed in the PR is included.
There are trade-offs, and neither option is universally better, but there are cases where `added` is preferable because `nofilter` makes adoption difficult.

### Official Release of replace

replace is a feature that enables more flexible conversion from working directory to target using regular expressions.
This feature actually existed before, but it was treated as an unofficial feature without documentation because tfaction-go could not support it.

```yaml:tfaction-root.yaml
replace:
  patterns:
    # Replace /services/ to / : e.g. github/services/foo => github/foo
    - regexp: /services/
      replace: /
    # Replace /production$ to /prod
    - regexp: /production$
      replace: /prod
    # Remove the prefix `google-` : e.g. foo/google-users/production => foo/users/prod
    - regexp: /google-(.*)/
      replace: "/$1/"
      flags: g
```

### Automatic aqua Installation

tfaction now installs aqua automatically, so users no longer need to install it themselves.
However, the aqua version is hardcoded and cannot be changed.
This makes it easier to adopt tfaction even if you are not already using aqua.

## Bug Fixes

- Properly catch exceptions in Node.js
- Support for Terragrunt v0.88.0 and later
- Fix inability to parse terragrunt plan and apply results
- Fix issues when tfaction-root.yaml is in a subdirectory
- Fix issues when the repository is checked out to a location other than github.workspace
- Fix inability to set `minimum_detection_interval` to 0 in drift detection
- Fix list-targets matching template directories
- Fix inability to place a root module at the repository root
  - Previously, an empty TFACTION_TARGET caused failures, preventing root modules at the repository root
- Fix conftest running even when destroy is enabled in tfaction.yaml

### Properly Catch Exceptions in Node.js

Fixed a bug where exceptions were not properly caught and were output as-is.

### Support for Terragrunt v0.88.0 and Later

https://github.com/suzuki-shunsuke/tfaction/issues/3148

Fixed an issue where tfaction did not work with Terragrunt v0.88.0.
It should also work with older versions of Terragrunt prior to v0.73.0 that do not support `terragrunt run`.

### Fix Inability to Parse terragrunt plan and apply Results

https://suzuki-shunsuke.github.io/tfcmt/terragrunt

Before:

![](https://storage.googleapis.com/zenn-user-upload/f91a5ff415ef-20260112.png)

After:

![](https://storage.googleapis.com/zenn-user-upload/887690246667-20260112.png)

Originally, users could work around this issue by setting the environment variable `TERRAGRUNT_LOG_DISABLE` to `true`, but tfaction now sets this environment variable automatically.

## Others

- Changed slashes `/` to underscores `__` in created branch names
  - Using `/` in branch names can cause issues, so this was changed
