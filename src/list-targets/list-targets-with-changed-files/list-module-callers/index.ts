import * as fs from "fs";
import * as path from "path";
import * as tmp from "tmp";
import * as semver from "semver";
import * as core from "@actions/core";
import {
  buildModuleToCallers,
  resolveRelativeCallTree,
  ModuleToCallers,
} from "./lib";
import * as input from "../../../lib/input";
import * as aqua from "../../../aqua";
import * as lib from "../../../lib";

export const main = async (executor: aqua.Executor, cfg: lib.Config) => {
  const configFiles = fs
    .readFileSync(input.getRequiredConfigFiles(), "utf8")
    .trim()
    .split("\n");
  const moduleFiles = fs
    .readFileSync(input.getRequiredModuleFiles(), "utf8")
    .trim()
    .split("\n");

  const moduleCallers = await list(
    cfg.config_dir,
    configFiles,
    moduleFiles,
    executor,
  );

  const json = JSON.stringify(moduleCallers);
  core.info(`file: ${json}`);
  const tmpobj = tmp.fileSync();
  fs.writeFileSync(tmpobj.name, json);
  core.setOutput("file", tmpobj.name);
};

export const list = async (
  configDir: string,
  configFiles: string[],
  moduleFiles: string[],
  executor: aqua.Executor,
): Promise<ModuleToCallers> => {
  // directory where uses modules => used modules
  const rawModuleCalls: Record<string, Array<string>> = {};

  const allTerraformFiles = Array.from([...configFiles, ...moduleFiles]);

  for (const tfFile of configFiles) {
    const tfDir = path.join(configDir, path.dirname(tfFile));
    if (!fs.existsSync(path.join(tfDir, "terragrunt.hcl"))) {
      continue;
    }
    const tmpobj = tmp.fileSync();
    await executor.exec("aqua", ["i", "-l", "-a"], {
      cwd: tfDir,
    });

    // Check terragrunt version
    const terragruntVersionOut = await executor.getExecOutput(
      "terragrunt",
      ["--version"],
      {
        cwd: tfDir,
        silent: true,
      },
    );
    let terragruntVersion = "";
    if (terragruntVersionOut.stdout.startsWith("terragrunt version ")) {
      terragruntVersion = terragruntVersionOut.stdout.slice(
        "terragrunt version ".length,
      );
    } else {
      terragruntVersion = terragruntVersionOut.stdout;
    }
    const terragruntArgs: string[] = [];
    // https://github.com/gruntwork-io/terragrunt/releases/tag/v0.85.0
    // --terragrunt-json-out was removed.
    if (semver.gte(terragruntVersion, "0.77.17")) {
      // https://github.com/gruntwork-io/terragrunt/releases/tag/v0.77.17
      // render command was added.
      terragruntArgs.push("render", "--json", "--write", "--out");
    } else if (semver.gte(terragruntVersion, "0.73.0")) {
      // https://github.com/gruntwork-io/terragrunt/releases/tag/v0.73.0
      // --out was added.
      terragruntArgs.push("render-json", "--out");
    } else {
      terragruntArgs.push("render-json", "--terragrunt-json-out");
    }

    await executor.exec("terragrunt", terragruntArgs.concat(tmpobj.name), {
      cwd: tfDir,
    });
    const source = JSON.parse(fs.readFileSync(tmpobj.name, "utf8")).terraform
      ?.source;
    if (!source) {
      continue;
    }
    if (
      source.startsWith("." + path.sep) ||
      source.startsWith(".." + path.sep)
    ) {
      const normalizedSource = path.normalize(source);
      if (rawModuleCalls[tfDir] === undefined) {
        rawModuleCalls[tfDir] = [normalizedSource];
      } else {
        rawModuleCalls[tfDir].push(normalizedSource);
      }
    }
  }

  for (const tfFile of allTerraformFiles) {
    if (tfFile == "") {
      continue;
    }

    const tfDir = path.join(configDir, path.dirname(tfFile));

    const outInspect = await executor.getExecOutput(
      "terraform-config-inspect",
      ["--json", tfDir],
      {
        cwd: tfDir,
      },
    );
    const inspection = JSON.parse(outInspect.stdout);

    // List keys of Local Path modules (source starts with ./ or ../) in module_calls
    const arr = Object.values(
      inspection["module_calls"] as Record<string, { source: string }>,
    ).flatMap((module) => {
      const source = module.source;
      if (
        source.startsWith("." + path.sep) ||
        source.startsWith(".." + path.sep)
      ) {
        return [source];
      } else {
        return [];
      }
    });
    if (rawModuleCalls[tfDir] === undefined) {
      rawModuleCalls[tfDir] = arr;
    } else {
      rawModuleCalls[tfDir].push(...arr);
    }
  }

  const moduleCallers = buildModuleToCallers(
    resolveRelativeCallTree(rawModuleCalls),
  );
  return moduleCallers;
};
