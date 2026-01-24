import * as checkTerraformSkip from "../../check-terraform-skip";
import * as terraformApply from "./terraform-apply";
import * as tfmigrateApply from "./tfmigrate-apply";
import * as env from "../../lib/env";

export const main = async () => {
  const jobType = env.all.TFACTION_JOB_TYPE;

  if (jobType === "terraform") {
    // Check if terraform should be skipped
    await checkTerraformSkip.main();
    const skipTerraform = env.tfactionSkipTerraform;

    if (!skipTerraform) {
      await terraformApply.main();
    }
  } else if (jobType === "tfmigrate") {
    await tfmigrateApply.main();
  }
};
