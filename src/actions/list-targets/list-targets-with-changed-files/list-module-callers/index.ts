import * as fs from "fs";
import * as path from "path";
import * as core from "@actions/core";
import type * as github from "@actions/github";
import * as tmp from "tmp";
import * as semver from "semver";
import * as aqua from "../../../../aqua";
import * as lib from "../../../../lib";
import { post } from "../../../../comment";

/**
 * List module callers in the git repository.
 * @param gitRootDir - Absolute path to the git root directory
 * @param configFiles - Relative file paths from git_root_dir to config files
 * @param githubToken - GitHub token used to post a PR comment when the inspection fails
 * @param executor
 * @param config - tfaction-root.yaml, used to get terraform_command of each directory
 * @param octokit - Used to post a PR comment when tofu isn't found
 * @param prNumber - The pull request number. 0 if there is no pull request
 * @returns Relative path to module from git_root_dir => Relative paths from git_root_dir to module callers
 */
export const list = async (
  gitRootDir: string,
  /** relative file paths from git_root_dir */
  configFiles: string[],
  githubToken: string,
  executor: aqua.Executor,
  config: TerraformCommandConfig,
  octokit: ReturnType<typeof github.getOctokit>,
  prNumber: number,
): Promise<ModuleToCallers> => {
  const rawModuleCalls: ModuleCalls = {};

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
    let terragruntVersion: string;
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

  for (const tfFile of configFiles) {
    if (tfFile == "") {
      continue;
    }

    /** a relative path from git_root_dir to module caller */
    const tfDir = path.dirname(tfFile);
    /** absolute path to working directory */
    const absTfDir = path.join(gitRootDir, tfDir);

    const moduleCalls = await inspect({
      executor,
      tfDir,
      absTfDir,
      githubToken,
      terraformCommand: lib.getTerraformCommand(config, tfDir),
      octokit,
      prNumber,
    });

    /** List of relative paths from git_root_dir to modules */
    const arr = Object.values(moduleCalls).flatMap((module) => {
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

/** The config needed to get terraform_command of a directory */
export type TerraformCommandConfig = Parameters<
  typeof lib.getTerraformCommand
>[0];

/** module name => module call */
type ModuleCallMap = Record<string, { source: string }>;

/** The error that `tofu show -module` prints when a value of static evaluation can't be computed */
const staticValueError = "Unable to compute static value";

type InspectInput = {
  executor: aqua.Executor;
  /** A relative path from git_root_dir */
  tfDir: string;
  /** An absolute path */
  absTfDir: string;
  githubToken: string;
  /** terraform_command of the directory */
  terraformCommand: string;
  octokit: ReturnType<typeof github.getOctokit>;
  prNumber: number;
};

/**
 * Get module calls of a directory.
 * Use `tofu show -module` if terraform_command is tofu and supports it,
 * otherwise terraform-config-inspect.
 */
const inspect = async (input: InspectInput): Promise<ModuleCallMap> => {
  if (lib.isTofu(input.terraformCommand)) {
    const result = await inspectWithTofu(input);
    if (result.moduleCalls) {
      core.info(
        `${input.tfDir}: module calls are resolved with \`${input.terraformCommand} show -module\``,
      );
      return result.moduleCalls;
    }
    core.info(
      `${input.tfDir}: module calls are resolved with terraform-config-inspect because ${result.reason}`,
    );
  } else {
    core.info(
      `${input.tfDir}: module calls are resolved with terraform-config-inspect because terraform_command is ${input.terraformCommand}`,
    );
  }
  return await inspectWithTerraformConfigInspect(input);
};

const inspectWithTerraformConfigInspect = async (
  input: InspectInput,
): Promise<ModuleCallMap> => {
  const out = await input.executor.getExecOutput(
    "terraform-config-inspect",
    ["--json"],
    {
      cwd: input.absTfDir,
      group: "terraform-config-inspect",
      comment: {
        token: input.githubToken,
        key: "terraform-config-inspect",
        vars: { tfaction_target: input.tfDir },
      },
    },
  );
  return JSON.parse(out.stdout)["module_calls"] as ModuleCallMap;
};

/**
 * @param helpStdout - stdout of `tofu show --help`
 * @returns true if `tofu show` supports `-module` (OpenTofu >= 1.11)
 */
export const supportsShowModule = (helpStdout: string): boolean => {
  return /^\s+-module=/m.test(helpStdout);
};

/**
 * @param stdout - stdout of `tofu show -module=. -json`
 * @returns module name => module call. `module_calls` is omitted when the directory calls no module
 */
export const parseShowModule = (stdout: string): ModuleCallMap => {
  return JSON.parse(stdout).root_module?.module_calls ?? {};
};

type TofuResult =
  | { moduleCalls: ModuleCallMap; reason?: undefined }
  | { moduleCalls?: undefined; reason: string };

/**
 * Get module calls with `tofu show -module`.
 * @returns module calls, or the reason to fall back to terraform-config-inspect
 * @throws if tofu can't be run or `tofu show -module` fails for a reason other than static evaluation
 */
export const inspectWithTofu = async (
  input: InspectInput,
): Promise<TofuResult> => {
  const command = input.terraformCommand;
  const comment: aqua.Comment = {
    token: input.githubToken,
    key: "tofu-unavailable",
    vars: { tfaction_target: input.tfDir },
  };
  // Install tofu defined in aqua.yaml of the directory, like plan does
  await input.executor.exec("aqua", ["i", "-l", "-a"], {
    cwd: input.absTfDir,
    comment,
  });

  let help: Awaited<ReturnType<aqua.Executor["getExecOutput"]>>;
  try {
    help = await input.executor.getExecOutput(command, ["show", "--help"], {
      cwd: input.absTfDir,
      silent: true,
      ignoreReturnCode: true,
      comment,
    });
  } catch (err) {
    // @actions/exec throws before starting the process if the command isn't found,
    // so the exec comment template isn't evaluated.
    if (input.prNumber > 0) {
      await post({
        octokit: input.octokit,
        prNumber: input.prNumber,
        templateKey: "tofu-not-found",
        vars: { tfaction_target: input.tfDir, command },
      });
    }
    throw new Error(`${command} isn't found in ${input.tfDir}`, {
      cause: err,
    });
  }
  if (help.exitCode !== 0) {
    throw new Error(
      `\`${command} show --help\` failed in ${input.tfDir} with exit code ${help.exitCode}`,
    );
  }
  if (!supportsShowModule(help.stdout)) {
    return {
      reason: `\`${command} show\` doesn't support -module (OpenTofu 1.11.0 or later is required)`,
    };
  }

  const out = await input.executor.getExecOutput(
    command,
    ["show", "-module=.", "-json"],
    {
      cwd: input.absTfDir,
      group: `${command} show -module=. -json`,
      ignoreReturnCode: true,
      comment: {
        token: input.githubToken,
        key: "tofu-show-module",
        vars: { tfaction_target: input.tfDir },
      },
    },
  );
  if (out.exitCode === 0) {
    return { moduleCalls: parseShowModule(out.stdout) };
  }
  if (out.stderr.includes(staticValueError)) {
    // list-targets can't see values given to plan (env, TF_VAR_* in the plan job)
    return {
      reason: `\`${command} show -module\` couldn't compute a value of static evaluation (${staticValueError})`,
    };
  }
  throw new Error(
    `\`${command} show -module=. -json\` failed in ${input.tfDir} with exit code ${out.exitCode}`,
  );
};
