import * as exec from "@actions/exec";
import * as core from "@actions/core";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as lib from "../lib";
import * as getGlobalConfig from "../get-global-config";

const listFiles = async (
  baseDir: string,
  fileName: string,
): Promise<string[]> => {
  // Run git ls-files
  const result = await exec.getExecOutput("git", ["ls-files", baseDir], {
    ignoreReturnCode: true,
  });

  const arr: string[] = [];
  for (const line of result.stderr.split("\n").map((l) => l.trim())) {
    if (line === "") {
      continue;
    }
    if (path.basename(line) === fileName) {
      arr.push(line);
    }
  }
  return arr;
};

export const main = async (): Promise<void> => {
  // Get global config
  const config = lib.getConfig();
  const globalConfigResult = getGlobalConfig.main_(config, {
    repository: process.env.GITHUB_REPOSITORY,
    drift_issue_number: process.env.TFACTION_DRIFT_ISSUE_NUMBER,
  });

  const baseWorkingDirectory = globalConfigResult.outputs.base_working_directory;
  const workingDirectoryFile = globalConfigResult.outputs.working_directory_file;
  const moduleBaseDirectory = globalConfigResult.outputs.module_base_directory;
  const moduleFile = globalConfigResult.outputs.module_file;

  // List working directories
  const workingDirs = await listFiles(
    baseWorkingDirectory,
    workingDirectoryFile,
  );

  // Write to temp file
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tfaction-"));
  const workingDirFile = path.join(tempDir, "working-dirs.txt");
  fs.writeFileSync(workingDirFile, workingDirs.join("\n"));

  // Output to stderr (for debugging)
  core.info(workingDirs.join("\n"));

  // Set output
  core.setOutput("file", workingDirFile);

  // List modules
  const modules = await listFiles(moduleBaseDirectory, moduleFile);

  // Write to temp file
  const moduleFilePath = path.join(tempDir, "modules.txt");
  fs.writeFileSync(moduleFilePath, modules.join("\n"));

  // Output to stderr (for debugging)
  core.info(modules.join("\n"));

  // Set output
  core.setOutput("module_file", moduleFilePath);
};
