import * as checkTerraformSkip from "./check-terraform-skip";
import * as conftest from "./conftest";
import * as exportAWSSecretsManager from "./export-aws-secrets-manager";
import * as exportSecrets from "./export-secrets";
import * as getGlobalConfig from "./get-global-config";
import * as getTargetConfig from "./get-target-config";
import * as listChangeModules from "./list-changed-modules";
import * as listModuleCallers from "./list-module-callers";
import * as listTargetsWithChangedFiles from "./list-targets-with-changed-files";
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
    ["export-aws-secrets-manager", exportAWSSecretsManager],
    ["export-secrets", exportSecrets],
    ["get-follow-up-pr-param", getFollowupPRParam],
    ["get-global-config", getGlobalConfig],
    ["get-or-create-drift-issue", getOrCreateDriftIssue],
    ["get-target-config", getTargetConfig],
    ["list-changed-modules", listChangeModules],
    ["list-module-callers", listModuleCallers],
    ["list-targets-with-changed-files", listTargetsWithChangedFiles],
    ["plan", plan],
    ["terraform-docs", terraformDocs],
    ["tfsec", tfsec],
    ["trivy", trivy],
    ["tflint", tflint],
    ["commit", commit],
  ]);
  const action = actions.get(inputs.action);
  if (action === undefined) {
    throw new Error(`Unknown action: ${inputs.action}`);
  }
  action.main();
};
