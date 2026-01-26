import type * as aqua from "../aqua";
import { run as runImpl } from "./run";

type Inputs = {
  /** A relative path from github.workspace */
  workingDirectory: string;
  repoRoot: string;
  githubToken: string;
  securefixActionAppId: string;
  securefixActionAppPrivateKey: string;
  securefixActionServerRepository: string;
  executor: aqua.Executor;
};

export const run = async (inputs: Inputs): Promise<void> => {
  await runImpl({
    workingDirectory: inputs.workingDirectory,
    repoRoot: inputs.repoRoot,
    githubToken: inputs.githubToken,
    securefixActionAppId: inputs.securefixActionAppId,
    securefixActionAppPrivateKey: inputs.securefixActionAppPrivateKey,
    securefixActionServerRepository: inputs.securefixActionServerRepository,
    executor: inputs.executor,
  });
};
