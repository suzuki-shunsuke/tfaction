---
sidebar_position: 3600
---

# v2 Release Note

## Summary

tfaction v2 includes various breaking changes, and all users need to modify their code.
Please refer to the upgrade guide for details.
tfaction, which was previously a collection of many actions, has been entirely rewritten as a single JavaScript Action, where functionality such as plan, apply, and test is selected via the `action` input.
This significantly improves both performance and maintainability.
The release also includes feature additions such as the introduction of a template engine, support for Reviewdog customization, and the official release of the target replacement feature.

## Improvements

- Performance improvements
- Improved maintainability
- Support for customizing Reviewdog configuration
- Official release of replace_target
- Automatic aqua installation
- Support for customizing PR title, body, and comment in scaffold
- Glob support in target_groups.working_directory
  - Enables more flexible configuration
- tflint --fix auto-correction enabled by default
- Added `github_token_for_github_provider` input for passing a GitHub Access Token for the GitHub Provider
- Automatic PR branch update when root modules are changed on the base branch compared to the feature branch
- Added ability to skip terraform plan and apply on a per-file basis
- Added ability to test workflows when workflow files are changed

### Performance Improvements

Previously, all `suzuki-shunsuke/tfaction/*` actions except `suzuki-shunsuke/tfaction/js` were Composite Actions.
In v2, they have been consolidated into a single JavaScript Action: `suzuki-shunsuke/tfaction`.
This significantly reduces the time spent downloading actions and greatly shortens the processing time of the `Set up job` step, which runs at the beginning of every GitHub Actions job.
While results vary by environment, we observed a reduction of approximately 20 to 40 seconds in our environment.
Additionally, rewriting everything as a single JavaScript Action eliminates the overhead between Composite Action steps and provides minor performance improvements by replacing external command execution with JavaScript.

The removal of AWS and Google Cloud authentication is also related to performance improvements.
Due to how GitHub Actions works, actions are downloaded during `Set up job` even if the step running the action is skipped.
This means that even when AWS or Google Cloud authentication is not needed, the action is still downloaded, which is wasteful.
Embedding the functionality of `aws-actions/configure-aws-credentials` and `google-github-actions/auth` into tfaction's TypeScript would avoid the download, but we decided against it due to the maintenance burden.
Instead, users now run these actions themselves as needed.
This also allows more flexible authentication handling than before.

### Improved Maintainability

Rewriting all code in TypeScript has improved maintainability.
Previously, with the Composite Action implementation, data was passed between steps using inputs/outputs and environment variables.
However, the type system for these interfaces is extremely limited.
Only the string type is supported, requiring data serialization, and it is difficult to catch mistakes in input/output names or types before execution.
Additionally, there are size limits on data, requiring file-based workarounds for large payloads.

In contrast, with everything written in TypeScript, the powerful type system and editor integration make it easy to catch mistakes, provide code completion, and write unit tests.

### Support for Customizing Reviewdog Configuration

Results from trivy and tflint are reported via reviewdog, and the configuration can now be customized.
The most significant change is that `-filter-mode` is now configurable.
Previously, `--filter-mode nofilter` was hard-coded, meaning code not changed in the PR was also included in the results.
By setting `--filter-mode` to `added`, only code changed in the PR is targeted.
There are trade-offs to both options, but in cases where `nofilter` makes adoption difficult, `added` may be preferable.

### Official Release of replace_target

replace_target is a feature that provides more flexible conversion from working directory to target using regular expressions.
This feature actually existed before, but since tfaction-go did not support it, it was treated as an unofficial feature and was not documented.

```yaml
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
However, the aqua version is hard-coded and cannot be changed.
This makes it easier to adopt tfaction even if you are not already using aqua.

### Skipping terraform plan and apply on a Per-File Basis

Added the ability to skip terraform plan and apply when editing files that do not affect the results.
For example, you can skip terraform plan and apply for PRs that only modify README.md.

### Testing Workflows When Workflow Files Are Changed

When a GitHub Actions Workflow that runs plan or apply is modified, even if no working directories are changed in the PR, a specified working directory is added to the `list-targets` output so that plan and apply are executed, allowing you to verify that the workflow functions correctly.
This prevents situations where plan breaks due to workflow modifications and ensures that apply failures are caught early.
It eliminates the need to manually modify files in an arbitrary directory just to trigger plan and apply for testing.

## Bug Fixes

- Properly catch exceptions in Node.js
- Support for Terragrunt v0.88.0 and later
- Fix failure to parse terragrunt plan and apply results
- Fix incorrect behavior when tfaction-root.yaml is in a subdirectory
- Fix incorrect behavior when the repository is checked out to a location other than github.workspace
- Fix inability to set `minimum_detection_interval` to 0 in drift detection
- Fix list-targets matching template directories
- Fix inability to place a root module at the repository root
  - Previously, an empty TFACTION_TARGET caused a failure, preventing root modules from being placed at the repository root
- Fix conftest running even when destroy is enabled in tfaction.yaml

### Properly Catch Exceptions in Node.js

Fixed a bug where exceptions were not properly caught and were output as-is.

### Support for Terragrunt v0.88.0 and Later

https://github.com/suzuki-shunsuke/tfaction/issues/3148

Fixed an issue where tfaction did not work with Terragrunt v0.88.0.
It should also work with older versions of Terragrunt prior to v0.73.0 that do not support `terragrunt run`.

### Fix Failure to Parse terragrunt plan and apply Results

https://suzuki-shunsuke.github.io/tfcmt/terragrunt

Before:

![](https://storage.googleapis.com/zenn-user-upload/f91a5ff415ef-20260112.png)

After:

![](https://storage.googleapis.com/zenn-user-upload/887690246667-20260112.png)

Previously, users could work around this by setting the environment variable `TERRAGRUNT_LOG_DISABLE` to `true`, but tfaction now sets this environment variable automatically.

## Others

- Changed slashes `/` to underscores `__` in created branch names
  - Using `/` in branch names can cause issues, so this was changed
