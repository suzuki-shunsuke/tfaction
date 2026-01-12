import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as aqua from "../aqua";

export const fmt = async (
  tfCommand: string,
  workingDir: string,
  executor: aqua.Executor,
): Promise<exec.ExecOutput> => {
  if (tfCommand !== "terragrunt") {
    core.startGroup(`${tfCommand} fmt`);
    const fmtResult = await executor.getExecOutput(
      tfCommand,
      ["fmt", "-recursive"],
      {
        cwd: workingDir,
      },
    );
    core.endGroup();
    return fmtResult;
  }
  // https://github.com/suzuki-shunsuke/tfaction/issues/3148
  // terragrunt v0.88.0: Drop the support `terragrunt fmt`
  // terragrunt v0.73.0: support `terrgrunt run`
  const runCode = await executor.exec("terragrunt", ["run", "--help"], {
    silent: true,
    ignoreReturnCode: true,
  });
  if (runCode === 0) {
    core.startGroup(`terragrunt run -- fmt`);
    const fmtResult = await executor.getExecOutput(
      tfCommand,
      ["run", "--", "fmt", "-recursive"],
      {
        cwd: workingDir,
      },
    );
    core.endGroup();
    return fmtResult;
  }
  core.startGroup(`terragrunt fmt`);
  const fmtResult = await executor.getExecOutput(
    tfCommand,
    ["fmt", "-recursive"],
    {
      cwd: workingDir,
    },
  );
  core.endGroup();
  return fmtResult;
};
