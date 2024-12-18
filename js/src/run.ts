import * as getTargetConfig from "./get-target-config";
import * as getGlobalConfig from "./get-global-config";
import * as checkTerraformSkip from "./check-terraform-skip";
import * as listChangeModules from "./list-changed-modules";
import * as exportAWSSecretsManager from "./export-aws-secrets-manager";

type Inputs = {
  action: string;
};

interface API {
  main(): Promise<void>;
}

export const main = async (inputs: Inputs) => {
  const actions = new Map<string, API>([
    ["check-terraform-skip", checkTerraformSkip],
    ["export-aws-secrets-manager", exportAWSSecretsManager],
    ["get-global-config", getGlobalConfig],
    ["get-target-config", getTargetConfig],
    ["list-changed-modules", listChangeModules],
  ]);
  const action = actions.get(inputs.action);
  if (action === undefined) {
    throw new Error(`Unknown action: ${inputs.action}`);
  }
  action.main();
};
