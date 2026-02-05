import * as aqua from "../aqua";

export type RunInput = {
  githubToken: string;
  aquaGlobalConfig: string;
  exportVariable: (name: string, val: string) => void;
};

export const run = async (input: RunInput): Promise<void> => {
  await aqua.NewExecutor({
    githubToken: input.githubToken,
  });
  input.exportVariable("AQUA_GLOBAL_CONFIG", input.aquaGlobalConfig);
};
