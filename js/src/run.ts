import { getTargetConfig } from "./get-target-config";

type Inputs = {
  action: string;
};

export const main = async (inputs: Inputs) => {
  switch (inputs.action) {
    case "get-target-config":
      getTargetConfig();
      return;
    default:
      throw new Error(`Unknown action: ${inputs.action}`);
  }
};
