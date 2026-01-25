import * as core from "@actions/core";
import * as github from "@actions/github";
import * as lib from "../lib";
import * as aqua from "../aqua";
import { run as runImpl } from "./run";

type Inputs = {
  workingDirectory: string;
  githubToken: string;
  configPath: string;
  executor: aqua.Executor;
};

export const run = async (inputs: Inputs): Promise<void> => {
  const config = await lib.getConfig();
  await runImpl({
    executor: inputs.executor,
    workingDirectory: inputs.workingDirectory,
    githubToken: inputs.githubToken,
    configPath: inputs.configPath,
    config: config,
    eventName: github.context.eventName,
    logger: {
      info: core.info,
    },
    githubCommentConfig: lib.GitHubCommentConfig,
  });
};
