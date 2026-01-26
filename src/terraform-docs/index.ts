import * as exec from "@actions/exec";
import * as github from "@actions/github";
import * as fs from "fs";
import * as tmp from "tmp";
import * as commit from "../commit";
import * as env from "../lib/env";
import * as aqua from "../aqua";
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
    eventName: github.context.eventName,
    tfactionTarget: env.all.TFACTION_TARGET,
    fs: {
      existsSync: fs.existsSync,
      readFileSync: fs.readFileSync,
      writeFileSync: fs.writeFileSync,
    },
    createTempFile: () => tmp.fileSync(),
    commitCreate: commit.create,
    execGetExecOutput: exec.getExecOutput,
  });
};
