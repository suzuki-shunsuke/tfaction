import * as exec from "@actions/exec";

/**
 * Get list of modified and untracked files
 */
export const getModifiedFiles = async (
  dir: string,
  cwd?: string,
): Promise<string[]> => {
  let output = "";
  await exec.exec(
    "git",
    ["ls-files", "--modified", "--others", "--exclude-standard", dir],
    {
      cwd,
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
      },
    },
  );
  return output
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
};

/**
 * Check if a file has uncommitted changes
 * @returns true if changed, false if unchanged
 */
export const hasFileChanged = async (
  file: string,
  cwd?: string,
): Promise<boolean> => {
  const exitCode = await exec.exec("git", ["diff", "--quiet", "--", file], {
    cwd,
    ignoreReturnCode: true,
    silent: true,
  });
  return exitCode !== 0;
};

/**
 * Check if a file is tracked by git
 * @returns true if tracked, false if untracked (new file)
 */
export const isFileTracked = async (
  file: string,
  cwd?: string,
): Promise<boolean> => {
  const exitCode = await exec.exec(
    "git",
    ["ls-files", "--error-unmatch", "--", file],
    {
      cwd,
      ignoreReturnCode: true,
      silent: true,
    },
  );
  return exitCode === 0;
};

/**
 * Get the current branch name
 */
export const getCurrentBranch = async (cwd?: string): Promise<string> => {
  let output = "";
  await exec.exec("git", ["branch", "--show-current"], {
    cwd,
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
    },
  });
  return output.trim();
};

/**
 * Check if a file is new or modified using git status --porcelain
 * @returns true if new or modified, false if unchanged
 */
export const hasFileChangedPorcelain = async (
  file: string,
  cwd?: string,
): Promise<boolean> => {
  let output = "";
  await exec.exec("git", ["status", "--porcelain", file], {
    cwd,
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
    },
  });
  return output.trim().length > 0;
};

/**
 * List all files matching the pattern in the git repository.
 * List files by git ls-files.
 * @param gitRootDir - Absolute path to the git root directory
 * @param fileName - File name pattern to search for
 * @returns Relative file paths from git_root_dir
 */
export const listWorkingDirFiles = async (
  gitRootDir: string,
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
    arr.push(line);
  }
  return arr;
};

/**
 *
 * @param cwd a relative path from github.workspace to tfaction-root.yaml
 * @returns an absolute path to the root directory of the git repository
 */
export const getRootDir = async (cwd: string): Promise<string> => {
  const out = await exec.getExecOutput(
    "git",
    ["rev-parse", "--show-toplevel"],
    {
      silent: true,
      cwd,
    },
  );
  return out.stdout.trim();
};
