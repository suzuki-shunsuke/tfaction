import * as fs from "fs";
import * as path from "path";
import * as tmp from "tmp";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
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
  for (const tfFile of allTerraformFiles) {
    if (tfFile == "") {
      continue;
    }

    const tfDir = path.dirname(tfFile);

    const outInspect = await exec.getExecOutput("terraform-config-inspect", [
      "--json",
      tfDir,
    ]);
    const inspection = JSON.parse(outInspect.stdout);

    // List keys of Local Path modules (source starts with ./ or ../) in module_calls
    rawModuleCalls[tfDir] = Object.values(inspection["module_calls"]).flatMap(
      (module: any) => {
        const source = module.source;
        if (
          source.startsWith("." + path.sep) ||
          source.startsWith(".." + path.sep)
        ) {
          return [source];
        } else {
          return [];
        }
      },
    );

    if (fs.existsSync(path.join(tfDir, "terragrunt.hcl"))) {
      const tmpobj = tmp.fileSync();
      await exec.exec("terragrunt", [
        "render-json",
        "--terragrunt-json-out",
        tmpobj.name,
        "--terragrunt-working-dir",
        tfDir,
      ]);
      const source = JSON.parse(fs.readFileSync(tmpobj.name, "utf8")).terraform
        ?.source;
      if (
        source.startsWith("." + path.sep) ||
        source.startsWith(".." + path.sep)
      ) {
        rawModuleCalls[tfDir].push(path.normalize(source));
      }
    }
  }

  const moduleCallers = buildModuleToCallers(
    resolveRelativeCallTree(rawModuleCalls),
  );
  const json = JSON.stringify(moduleCallers);
  core.info(`file: ${json}`);
  core.setOutput("file", json);
};
