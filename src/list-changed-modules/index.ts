import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";

export const main = async () => {
  const changedFiles = fs
    .readFileSync(core.getInput("changed_files", { required: true }), "utf8")
    .split("\n");
  const configFiles = fs
    .readFileSync(core.getInput("config_files", { required: true }), "utf8")
    .split("\n");
  const modules = run(configFiles, changedFiles);

  core.info(`modules: ${Array.from(modules)}`);
  core.setOutput("modules", Array.from(modules));
};

export const run = (
  configFiles: string[],
  changedFiles: string[],
): string[] => {
  const workingDirs = new Set<string>();
  for (const configFile of configFiles) {
    if (configFile === "") {
      continue;
    }
    workingDirs.add(path.dirname(configFile));
  }
  const modules = new Set<string>();
  for (const changedFile of changedFiles) {
    if (changedFile === "") {
      continue;
    }
    for (const workingDir of workingDirs) {
      if (changedFile.startsWith(workingDir + "/")) {
        modules.add(workingDir);
      }
    }
  }
  return Array.from(modules);
};
