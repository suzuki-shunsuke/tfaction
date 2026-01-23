# File Paths

This document explains how tfaction handles file paths.
tfaction deals with file paths in various ways, which can be quite complex.
Previously, path handling was vague, and it was unclear what the base directory was for function arguments, return values, and configuration items.
This caused confusion during implementation and was a source of bugs.
Therefore, we define the file path handling rules clearly here.

- tfaction-root.yaml and working directories are assumed to be in the same Git repository
- TFACTION_CONFIG is either an absolute path or a relative path from github.workspace
- The following are relative paths from the Git repository root where tfaction-root.yaml exists:
  - File paths in configuration files
  - working_directory output by actions
  - TFACTION_WORKING_DIR
  - Function arguments and return values when they are relative paths without specific notes
- When executing git commands like `git ls-files`, cwd must be within the Git repository
  - If cwd is not specified, it defaults to github.workspace, but github.workspace may not be within the Git repository (e.g., when checking out to a parent directory of github.workspace), so cwd should be explicitly specified
- The Git repository root directory is the directory containing tfaction-root.yaml, and its absolute path is obtained via `git rev-parse --show-toplevel`
  - lib.GetGitRootDir
- When creating commits using Securefix Action or Commit Action, root_dir is the Git root directory, and files are relative paths from the Git root directory
