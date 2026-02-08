import * as exec from "@actions/exec";
import * as aqua from "../../aqua";

export const fmt = async (
  tfCommand: string,
  workingDir: string,
  executor: aqua.Executor,
): Promise<exec.ExecOutput> => {
  const terragruntRunAvailable =
    tfCommand === "terragrunt" &&
    (await aqua.checkTerrgruntRun(executor, workingDir));

  const fmtResult = await executor.getExecOutput(
    tfCommand,
    terragruntRunAvailable
      ? ["run", "--", "fmt", "-recursive"]
      : ["fmt", "-recursive"],
    {
      cwd: workingDir,
      group: terragruntRunAvailable
        ? `${tfCommand} run -- fmt`
        : `${tfCommand} fmt`,
    },
  );
  return fmtResult;
};
