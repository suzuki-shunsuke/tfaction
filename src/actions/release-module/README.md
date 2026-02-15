# release-module

Creates a GitHub Tag and Release for the specified module.
The module is expected to be referenced as a GitHub Repository Source.
To manage versions of multiple modules in a monorepo, the version includes a string where `/` in the module path is replaced with `_`.

## Inputs

- `module_path`: Directory path where the module exists. Relative path from the git root directory.
- `version`: Module version. A SemVer-compliant string. The actually created tag appends a string where `/` in the module path is replaced with `_`.

## Generated tag format

`module_{module_path with / replaced by _}_{version}`
