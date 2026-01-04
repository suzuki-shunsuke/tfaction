import * as checkTerraformSkip from "./check-terraform-skip";
import * as conftest from "./conftest";
import * as createFollowUpPR from "./create-follow-up-pr";
import * as createScaffoldModulePR from "./create-scaffold-module-pr";
import * as createScaffoldPR from "./create-scaffold-pr";
import * as scaffoldModule from "./scaffold-module";
import * as scaffoldTfmigrate from "./scaffold-tfmigrate";
import * as scaffoldWorkingDir from "./scaffold-working-dir";
import * as setup from "./setup";
import * as exportAWSSecretsManager from "./export-aws-secrets-manager";
import * as exportSecrets from "./export-secrets";
import * as generateConfigOut from "./generate-config-out";
import * as getGlobalConfig from "./get-global-config";
import * as getTargetConfig from "./get-target-config";
import * as listChangeModules from "./list-changed-modules";
import * as install from "./install";
import * as pickOutDriftIssues from "./pick-out-drift-issues";
import * as listModuleCallers from "./list-module-callers";
import * as listTargets from "./list-targets";
import * as listTargetsWithChangedFiles from "./list-targets-with-changed-files";
import * as createDriftIssues from "./create-drift-issues";
import * as getOrCreateDriftIssue from "./get-or-create-drift-issue";
import * as updateDriftIssue from "./update-drift-issue";
import * as setDriftEnv from "./set-drift-env";
import * as syncDriftIssueDescription from "./sync-drift-issue-description";
import * as getFollowupPRParam from "./get-follow-up-pr-param";
import * as tfsec from "./tfsec";
import * as trivy from "./trivy";
import * as tflint from "./tflint";
import * as commit from "./commit";
import * as terraformDocs from "./terraform-docs";
import * as apply from "./apply";
import * as aquaUpdateChecksum from "./aqua-update-checksum";
import * as plan from "./plan";
import * as releaseModule from "./release-module";
import * as ciinfo from "./ci-info";
import * as listWorkingDirs from "./list-working-dirs";
import * as downloadPlan from "./download-plan";
import * as terraformApply from "./terraform-apply";
import * as terraformInit from "./terraform-init";
import * as test from "./test";
import * as testModule from "./test-module";
import * as tfmigrateApply from "./tfmigrate-apply";

type Inputs = {
  action: string;
};

interface API {
  main(): Promise<void>;
}

export const main = async (inputs: Inputs) => {
  const actions = new Map<string, API>([
    ["apply", apply],
    ["conftest", conftest],
    ["create-drift-issues", createDriftIssues],
    ["create-follow-up-pr", createFollowUpPR],
    ["create-scaffold-module-pr", createScaffoldModulePR],
    ["create-scaffold-pr", createScaffoldPR],
    ["export-aws-secrets-manager", exportAWSSecretsManager],
    ["export-secrets", exportSecrets],
    ["generate-config-out", generateConfigOut],
    ["get-global-config", getGlobalConfig],
    ["get-or-create-drift-issue", getOrCreateDriftIssue],
    ["get-target-config", getTargetConfig],
    ["install", install],
    ["list-targets", listTargets],
    ["pick-out-drift-issues", pickOutDriftIssues],
    ["plan", plan],
    ["release-module", releaseModule],
    ["scaffold-module", scaffoldModule],
    ["scaffold-tfmigrate", scaffoldTfmigrate],
    ["scaffold-working-dir", scaffoldWorkingDir],
    ["setup", setup],
    ["terraform-init", terraformInit],
    ["terraform-docs", terraformDocs],
    ["test", test],
    ["test-module", testModule],
    ["update-drift-issue", updateDriftIssue],
    ["set-drift-env", setDriftEnv],
    ["sync-drift-issue-description", syncDriftIssueDescription],
  ]);
  const action = actions.get(inputs.action);
  if (action === undefined) {
    throw new Error(`Unknown action: ${inputs.action}`);
  }
  action.main();
};
