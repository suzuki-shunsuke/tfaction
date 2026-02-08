import * as path from "path";

// --- Branded types ---
export type AbsolutePath = string & { readonly __brand: "AbsolutePath" };
export type GitRelativePath = string & { readonly __brand: "GitRelativePath" };
export type GitRootPath = AbsolutePath & { readonly __gitRoot: true };

// --- Constructors (validation at boundaries) ---
export const absolutePath = (p: string): AbsolutePath => {
  if (!path.isAbsolute(p)) {
    throw new Error(`Expected absolute path, got: ${p}`);
  }
  return p as AbsolutePath;
};

export const gitRelativePath = (p: string): GitRelativePath => {
  if (path.isAbsolute(p)) {
    throw new Error(`Expected git-relative path, got absolute: ${p}`);
  }
  return p as GitRelativePath;
};

// --- Conversion functions ---
export const joinAbsolute = (
  base: AbsolutePath,
  ...components: string[]
): AbsolutePath => {
  return path.join(base, ...components) as AbsolutePath;
};

export const toGitRelative = (
  gitRoot: AbsolutePath,
  target: AbsolutePath,
): GitRelativePath => {
  const rel = path.relative(gitRoot, target);
  if (path.isAbsolute(rel) || rel.startsWith("..")) {
    throw new Error(`Path ${target} is not inside git root ${gitRoot}`);
  }
  return rel as GitRelativePath;
};

export const resolveFromGitRoot = (
  gitRoot: AbsolutePath,
  rel: GitRelativePath,
): AbsolutePath => {
  return path.join(gitRoot, rel) as AbsolutePath;
};

export const joinGitRelative = (
  base: GitRelativePath,
  ...components: string[]
): GitRelativePath => {
  return path.join(base, ...components) as GitRelativePath;
};
