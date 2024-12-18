import * as getTargetConfig from "./get-target-config";
import * as getGlobalConfig from "./get-global-config";
import * as checkTerraformSkip from "./check-terraform-skip";
import * as listChangeModules from "./list-changed-modules";

type Inputs = {
  action: string;
};

interface API {
  main(): Promise<void>;
}

export const main = async (inputs: Inputs) => {
  const actions = new Map<string, API>([
    ["check-terraform-skip", checkTerraformSkip],
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
