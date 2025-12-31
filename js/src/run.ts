import * as checkTerraformSkip from "./check-terraform-skip";
import * as conftest from "./conftest";
import * as createFollowUpCommit from "./create-follow-up-commit";
import * as createFollowUpPR from "./create-follow-up-pr";
import * as createGroupLabel from "./create-group-label";
import * as exportAWSSecretsManager from "./export-aws-secrets-manager";
import * as exportSecrets from "./export-secrets";
import * as getGlobalConfig from "./get-global-config";
import * as getTargetConfig from "./get-target-config";
import * as listChangeModules from "./list-changed-modules";
import * as listModuleCallers from "./list-module-callers";
import * as listTargetsWithChangedFiles from "./list-targets-with-changed-files";
import * as skipCreateFollowUpPR from "./skip-create-follow-up-pr";
import * as createDriftIssues from "./create-drift-issues";
import * as getOrCreateDriftIssue from "./get-or-create-drift-issue";
import * as getFollowupPRParam from "./get-follow-up-pr-param";
import * as tfsec from "./tfsec";
import * as trivy from "./trivy";
import * as tflint from "./tflint";
import * as commit from "./commit";
import * as terraformDocs from "./terraform-docs";
import * as aquaUpdateChecksum from "./aqua-update-checksum";
import * as plan from "./plan";
import * as ciinfo from "./ci-info";
import * as listWorkingDirs from "./list-working-dirs";
import * as downloadPlan from "./download-plan";
import * as terraformApply from "./terraform-apply";
import * as tfmigrateApply from "./tfmigrate-apply";

type Inputs = {
  action: string;
};

interface API {
  main(): Promise<void>;
}

export const main = async (inputs: Inputs) => {
  const actions = new Map<string, API>([
    ["aqua-update-checksum", aquaUpdateChecksum],
    ["check-terraform-skip", checkTerraformSkip],
    ["conftest", conftest],
    ["create-drift-issues", createDriftIssues],
    ["create-follow-up-commit", createFollowUpCommit],
    ["create-follow-up-pr", createFollowUpPR],
    ["create-group-label", createGroupLabel],
    ["download-plan", downloadPlan],
    ["export-aws-secrets-manager", exportAWSSecretsManager],
    ["export-secrets", exportSecrets],
    ["get-follow-up-pr-param", getFollowupPRParam],
    ["get-global-config", getGlobalConfig],
    ["get-or-create-drift-issue", getOrCreateDriftIssue],
    ["get-target-config", getTargetConfig],
    ["list-changed-modules", listChangeModules],
    ["list-module-callers", listModuleCallers],
    ["list-targets-with-changed-files", listTargetsWithChangedFiles],
    ["list-working-dirs", listWorkingDirs],
    ["plan", plan],
    ["skip-create-follow-up-pr", skipCreateFollowUpPR],
    ["terraform-apply", terraformApply],
    ["terraform-docs", terraformDocs],
    ["tfmigrate-apply", tfmigrateApply],
    ["tfsec", tfsec],
    ["trivy", trivy],
    ["tflint", tflint],
    ["commit", commit],
    ["ci-info", ciinfo],
  ]);
  const action = actions.get(inputs.action);
  if (action === undefined) {
    throw new Error(`Unknown action: ${inputs.action}`);
  }
  action.main();
};
