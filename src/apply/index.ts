import * as checkTerraformSkip from "../check-terraform-skip";
import * as terraformApply from "../terraform-apply";
import * as tfmigrateApply from "../tfmigrate-apply";

export const main = async () => {
  const jobType = process.env.TFACTION_JOB_TYPE;

  if (jobType === "terraform") {
    // Check if terraform should be skipped
    await checkTerraformSkip.main();
    const skipTerraform = process.env.TFACTION_SKIP_TERRAFORM === "true";

    if (!skipTerraform) {
      await terraformApply.main();
    }
  } else if (jobType === "tfmigrate") {
    await tfmigrateApply.main();
  }
};
