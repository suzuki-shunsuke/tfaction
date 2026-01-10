import * as exec from "@actions/exec";
import * as path from "path";

export const listFiles = async (
  baseDir: string,
  fileName: string,
): Promise<string[]> => {
  // Run git ls-files
  const result = await exec.getExecOutput("git", ["ls-files", baseDir], {
    ignoreReturnCode: true,
    silent: true,
  });

  const arr: string[] = [];
  for (const line of result.stdout.split("\n").map((l) => l.trim())) {
    if (line === "") {
      continue;
    }
    if (path.basename(line) === fileName) {
      arr.push(line);
    }
  }
  return arr;
};
