import * as exec from "@actions/exec";
import * as core from "@actions/core";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as lib from "../../lib";

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

export const main = async (): Promise<void> => {
  const config = lib.getConfig();

  const baseWorkingDirectory = config.base_working_directory;
  const workingDirectoryFile = config.working_directory_file;
  const moduleBaseDirectory = config.module_base_directory;
  const moduleFile = config.module_file;

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
