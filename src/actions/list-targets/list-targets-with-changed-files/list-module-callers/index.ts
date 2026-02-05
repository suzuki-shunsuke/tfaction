import * as fs from "fs";
import * as path from "path";
import * as tmp from "tmp";
import * as semver from "semver";
import * as aqua from "../../../../aqua";

/**
 * List module callers in the git repository.
 * @param gitRootDir - Absolute path to the git root directory
 * @param configFiles - Relative file paths from git_root_dir to config files
 * @param moduleFiles - Relative file paths from git_root_dir to module files
 * @param executor
 * @returns Relative path to module from git_root_dir => Relative paths from git_root_dir to module callers
 */
export const list = async (
  gitRootDir: string,
  /** relative file paths from git_root_dir */
  configFiles: string[],
  /** relative file paths from git_root_dir */
  moduleFiles: string[],
  executor: aqua.Executor,
): Promise<ModuleToCallers> => {
  const rawModuleCalls: ModuleCalls = {};

  /** Relative paths from git root dir to working directories and modules */
  const allTerraformFiles = Array.from([...configFiles, ...moduleFiles]);

  for (const tfFile of configFiles) {
    /** A relative path from git_root_dir to module caller */
    const tfDir = path.dirname(tfFile);
    /** absolute path to working directory */
    const absTfDir = path.join(gitRootDir, path.dirname(tfFile));
    if (!fs.existsSync(path.join(absTfDir, "terragrunt.hcl"))) {
      continue;
    }
    const tmpobj = tmp.fileSync();
    await executor.exec("aqua", ["i", "-l", "-a"], {
      cwd: absTfDir,
    });

    // Check terragrunt version
    const terragruntVersionOut = await executor.getExecOutput(
      "terragrunt",
      ["--version"],
      {
        cwd: absTfDir,
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
      cwd: absTfDir,
    });
    /** A relative path from working directory to module dir */
    const source = JSON.parse(fs.readFileSync(tmpobj.name, "utf8")).terraform
      ?.source;
    if (!source) {
      continue;
    }
    if (
      source.startsWith("." + path.sep) ||
      source.startsWith(".." + path.sep)
    ) {
      /** A relative path from git root dir to source */
      const normalizedSource = path.join(tfDir, source);
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

    /** a relative path from git_root_dir to module caller */
    const tfDir = path.dirname(tfFile);
    /** absolute path to working directory */
    const absTfDir = path.join(gitRootDir, tfDir);

    const outInspect = await executor.getExecOutput(
      "terraform-config-inspect",
      ["--json"],
      {
        cwd: absTfDir,
      },
    );
    const inspection = JSON.parse(outInspect.stdout);

    /** List of relative paths from git_root_dir to modules */
    const arr = Object.values(
      inspection["module_calls"] as Record<string, { source: string }>,
    ).flatMap((module) => {
      const source = module.source;
      if (
        source.startsWith("." + path.sep) ||
        source.startsWith(".." + path.sep)
      ) {
        return [path.join(tfDir, source)];
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
  return buildModuleToCallers(rawModuleCalls);
};

/**
 * Maps a directory that uses modules to the list of modules it uses.
 * key: A relative path from git_root_dir to module caller. A directory calling modules.
 * value: relative paths from git_root_dir to modules. Modules that the key calls.
 */
type ModuleCalls = Record<string, string[]>;

/**
 * Maps a module to the list of directories that use it.
 * key: relative path from git_root_dir to module. A module that is called.
 * value: relative paths from git_root_dir to module caller. Directories calling the key.
 */
export type ModuleToCallers = Record<string, string[]>;

/**
 * Recursively finds all directories that call the specified module,
 * including both direct and indirect callers.
 *
 * @param moduleCalls - A relative path from git_root_dir to module caller => relative paths from git_root_dir to modules
 * @param module - Relative path from git_root_dir to module
 * @returns An array of all directories that directly or indirectly call the module
 */
const findCallers = (moduleCalls: ModuleCalls, module: string): string[] => {
  const callers = [];
  for (const [directCaller, modules] of Object.entries(moduleCalls)) {
    if (modules.includes(module)) {
      // directCaller calls module
      // parentCallers call directCaller, meaning they call module indirectly
      const parentCallers = findCallers(moduleCalls, directCaller);
      callers.push(directCaller, ...parentCallers);
    }
  }
  return callers;
};

/**
 * Builds a reverse lookup map from modules to their callers.
 * This is useful for determining which directories are affected
 * when a module is changed.
 *
 * @param moduleCalls
 * @returns Relative path from git_root_dir to module => Relative paths from git_root_dir to module callers
 */
export const buildModuleToCallers = (
  moduleCalls: ModuleCalls,
): ModuleToCallers => {
  const moduleToCallers: ModuleToCallers = {};
  /** relative paths from git_root_dir to modules */
  const modules = [...new Set(Object.values(moduleCalls).flat())];
  for (const module of modules) {
    if (!moduleToCallers[module]) {
      moduleToCallers[module] = [];
    }
    moduleToCallers[module].push(...findCallers(moduleCalls, module));
  }
  return moduleToCallers;
};
