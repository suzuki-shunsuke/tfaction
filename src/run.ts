import * as createFollowUpPR from "./actions/create-follow-up-pr";
import * as createScaffoldPR from "./actions/create-scaffold-pr";
import * as scaffoldTfmigrate from "./actions/scaffold-tfmigrate";
import * as scaffoldWorkingDir from "./actions/scaffold-working-dir";
import * as setup from "./actions/setup";
import * as exportAWSSecretsManager from "./actions/export-aws-secrets-manager";
import * as generateConfigOut from "./actions/generate-config-out";
import * as getTargetConfig from "./actions/get-target-config";
import * as pickOutDriftIssues from "./actions/pick-out-drift-issues";
import * as listTargets from "./actions/list-targets";
import * as outputGithubSecrets from "./actions/output-github-secrets";
import * as createDriftIssues from "./actions/create-drift-issues";
import * as getOrCreateDriftIssue from "./actions/get-or-create-drift-issue";
import * as updateDriftIssue from "./actions/update-drift-issue";
import * as setDriftEnv from "./actions/set-drift-env";
import * as syncDriftIssueDescription from "./actions/sync-drift-issue-description";
import * as apply from "./actions/apply";
import * as plan from "./actions/plan";
import * as releaseModule from "./actions/release-module";
import * as terraformInit from "./actions/terraform-init";
import * as test from "./actions/test";

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
    ["create-scaffold-pr", createScaffoldPR],
    ["export-aws-secrets-manager", exportAWSSecretsManager],
    ["generate-config-out", generateConfigOut],
    ["get-or-create-drift-issue", getOrCreateDriftIssue],
    ["get-target-config", getTargetConfig],
    ["list-targets", listTargets],
    ["output-github-secrets", outputGithubSecrets],
    ["pick-out-drift-issues", pickOutDriftIssues],
    ["plan", plan],
    ["release-module", releaseModule],
    ["scaffold-tfmigrate", scaffoldTfmigrate],
    ["scaffold-working-dir", scaffoldWorkingDir],
    ["setup", setup],
    ["terraform-init", terraformInit],
    ["test", test],
    ["update-drift-issue", updateDriftIssue],
    ["set-drift-env", setDriftEnv],
    ["sync-drift-issue-description", syncDriftIssueDescription],
  ]);
  const action = actions.get(inputs.action);
  if (action === undefined) {
    throw new Error(`Unknown action: ${inputs.action}`);
  }
  await action.main();
};
