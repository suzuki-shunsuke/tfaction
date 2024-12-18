import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";
import { buildModuleToCallers, resolveRelativeCallTree } from "./lib";

export const main = async () => {
  const configFiles = fs
    .readFileSync(core.getInput("config_files"), "utf8")
    .split("\n");
  const moduleFiles = fs
    .readFileSync(core.getInput("module_files"), "utf8")
    .split("\n");

  // directory where uses modules => modules which are used
  const rawModuleCalls: Record<string, Array<string>> = {};

  const allTerraformFiles = Array.from([...configFiles, ...moduleFiles]);
  allTerraformFiles.forEach((tfFile) => {
    if (tfFile == "") {
      return;
    }

    const tfDir = path.dirname(tfFile);
    const inspection = JSON.parse(
      child_process
        .execSync(`terraform-config-inspect --json ${tfDir}`)
        .toString("utf-8"),
    );

    // List keys of Local Path modules (source starts with ./ or ../) in module_calls
    rawModuleCalls[tfDir] = Object.values(inspection["module_calls"]).flatMap(
      (module: any) => {
        const source = module.source;
        if (source.startsWith("./") || source.startsWith("../")) {
          return [source];
        } else {
          return [];
        }
      },
    );
  });

  const moduleCallers = buildModuleToCallers(
    resolveRelativeCallTree(rawModuleCalls),
  );
  const json = JSON.stringify(moduleCallers);
  core.info(`file: ${json}`);
  core.setOutput("file", json);
};
