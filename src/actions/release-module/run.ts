export type Logger = {
  info: (message: string) => void;
};

export type RunInput = {
  modulePath: string;
  version: string;
  sha: string;
  serverUrl: string;
  repository: string;
  owner: string;
  repo: string;
  logger: Logger;
};

export type RunDependencies = {
  createRef: (params: {
    owner: string;
    repo: string;
    ref: string;
    sha: string;
  }) => Promise<unknown>;
  createRelease: (params: {
    owner: string;
    repo: string;
    tag_name: string;
    name: string;
    body: string;
  }) => Promise<unknown>;
  isDirectory: (path: string) => boolean;
};

export const generateTag = (modulePath: string, version: string): string => {
  const moduleName = modulePath.replace(/\//g, "_");
  return `module_${moduleName}_${version}`;
};

export const run = async (
  input: RunInput,
  deps: RunDependencies,
): Promise<void> => {
  const {
    modulePath,
    version,
    sha,
    serverUrl,
    repository,
    owner,
    repo,
    logger,
  } = input;

  // Validate inputs
  if (!modulePath) {
    throw new Error("module_path is required");
  }
  if (!version) {
    throw new Error("version is required");
  }

  // Check if module path exists
  if (!deps.isDirectory(modulePath)) {
    throw new Error(`module_path is invalid. ${modulePath} isn't found`);
  }

  // Generate tag name
  const tag = generateTag(modulePath, version);
  logger.info(`Tag: ${tag}`);

  // Create tag
  logger.info(`Creating tag ${tag}`);
  await deps.createRef({
    owner,
    repo,
    ref: `refs/tags/${tag}`,
    sha,
  });

  // Create release
  const note = `module: ${modulePath}
version: ${version}

[Source code](${serverUrl}/${repository}/tree/${tag}/${modulePath})
[Versions](${serverUrl}/${repository}/releases?q=${modulePath})`;

  logger.info(`Creating release ${tag}`);
  await deps.createRelease({
    owner,
    repo,
    tag_name: tag,
    name: tag,
    body: note,
  });

  logger.info(`Released ${tag}`);
};
