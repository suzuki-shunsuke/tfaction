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
import * as install from "./install";
import * as pickOutDriftIssues from "./pick-out-drift-issues";
import * as listTargets from "./list-targets";
import * as createDriftIssues from "./create-drift-issues";
import * as getOrCreateDriftIssue from "./get-or-create-drift-issue";
import * as updateDriftIssue from "./update-drift-issue";
import * as setDriftEnv from "./set-drift-env";
import * as syncDriftIssueDescription from "./sync-drift-issue-description";
import * as terraformDocs from "./terraform-docs";
import * as apply from "./apply";
import * as plan from "./plan";
import * as releaseModule from "./release-module";
import * as terraformInit from "./terraform-init";
import * as test from "./test";
import * as testModule from "./test-module";

type Inputs = {
  action: string;
};

interface API {
  main(): Promise<void>;
}

export const main = async (inputs: Inputs) => {
  const actions = new Map<string, API>([
    ["apply", apply],
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
