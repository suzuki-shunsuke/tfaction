/**
 * Builds a warning message for a plan or apply step that runs even though
 * terraform is skipped.
 *
 * list-targets decides whether terraform plan and apply are necessary and
 * reports it as the `skip_terraform` field of each target. Gating the step
 * with that field is the recommended way to act on it, so that the action
 * doesn't run at all. Honoring `TFACTION_SKIP_TERRAFORM` is a backstop for
 * workflows that don't gate the step.
 */
export const warnSkipTerraform = (action: "plan" | "apply"): string =>
  `terraform ${action} is skipped because TFACTION_SKIP_TERRAFORM is true.
Gate the step with the skip_terraform field of the list-targets output so that the action doesn't run at all:

  - uses: suzuki-shunsuke/tfaction@latest
    if: matrix.target.skip_terraform != true
    with:
      action: ${action}

https://suzuki-shunsuke.github.io/tfaction/docs/skip-terraform`;
