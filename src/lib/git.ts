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
