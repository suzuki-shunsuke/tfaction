import { getTargetConfig } from "./get-target-config";
import { getGlobalConfig } from "./get-global-config/src";

type Inputs = {
  action: string;
};

export const main = async (inputs: Inputs) => {
  switch (inputs.action) {
    case "get-target-config":
      getTargetConfig();
      return;
    case "get-global-config":
      getGlobalConfig();
      return;
    default:
      throw new Error(`Unknown action: ${inputs.action}`);
  }
};
