/**
 * Builds a warning message telling the user that the step should have been
 * gated with the `skip_terraform` field of the list-targets output.
 *
 * tfaction doesn't skip terraform plan and apply by itself.
 * list-targets decides whether they're necessary and reports it as
 * `skip_terraform`, and the workflow has to gate the steps with it.
 */
export const warnSkipTerraform = (action: "plan" | "apply"): string =>
  `TFACTION_SKIP_TERRAFORM is true, but the ${action} action is running.
tfaction doesn't skip terraform ${action} by itself.
Gate the step with the skip_terraform field of the list-targets output:

  - uses: suzuki-shunsuke/tfaction@latest
    if: matrix.target.skip_terraform != true
    with:
      action: ${action}

https://suzuki-shunsuke.github.io/tfaction/docs/skip-terraform`;
