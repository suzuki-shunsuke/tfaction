import * as exec from "@actions/exec";
import * as path from "path";

/**
 *
 * @param gitRootDir
 * @param configDir
 * @param fileName
 * @returns A list of files relative to the config directory
 */
export const listFiles = async (
  gitRootDir: string,
  configDir: string,
  fileName: string,
): Promise<string[]> => {
  const result = await exec.getExecOutput(
    "git",
    ["ls-files", `*/${fileName}`],
    {
      ignoreReturnCode: true,
      silent: true,
      cwd: gitRootDir,
    },
  );

  const arr: string[] = [];
  for (const line of result.stdout.split("\n").map((l) => l.trim())) {
    if (line === "") {
      continue;
    }
    arr.push(path.relative(configDir, line));
  }
  return arr;
};
