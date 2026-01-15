import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import Handlebars from "handlebars";

import * as aqua from "../aqua";
import * as lib from "../lib";
import * as env from "../lib/env";
import * as git from "../lib/git";

const copyDirectory = (src: string, dest: string): void => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

const replaceInFiles = async (
  workingDir: string,
  vars: Record<string, string>,
): Promise<void> => {
  const files = await git.getModifiedFiles(".", workingDir);

  for (const file of files) {
    const filePath = path.join(workingDir, file);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath, "utf8");

      const newContent = Handlebars.compile(content)(vars);

      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent);
      }
    }
  }
};

export const main = async () => {
  const githubToken = core.getInput("github_token");

  const configDir = path.dirname(lib.getConfigPathFromEnv());

  // Validate inputs
  if (!env.tfactionModulePath) {
    throw new Error("env.TFACTION_MODULE_PATH is required");
  }
  if (!env.tfactionModuleTemplateDir) {
    throw new Error("env.TFACTION_MODULE_TEMPLATE_DIR is required");
  }

  const modulePath = path.join(configDir, env.tfactionModulePath);
  const templateDir = path.join(configDir, env.tfactionModuleTemplateDir);

  // Check if module path already exists
  if (fs.existsSync(modulePath)) {
    throw new Error(`file exists: ${modulePath}`);
  }

  // Check if template directory exists
  if (!fs.existsSync(templateDir) || !fs.statSync(templateDir).isDirectory()) {
    throw new Error(`${templateDir} doesn't exist`);
  }

  // Create parent directory
  const parentDir = path.dirname(modulePath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
    core.info(`Created parent directory: ${parentDir}`);
  }

  // Copy template directory
  copyDirectory(templateDir, modulePath);
  core.info(`Copied template from ${templateDir} to ${modulePath}`);

  // Create tfaction_module.yaml
  fs.writeFileSync(path.join(modulePath, "tfaction_module.yaml"), "{}\n");
  core.info("Created tfaction_module.yaml");

  // Get module name and path for replacements
  const moduleName = path.basename(modulePath);
  const repository = env.githubRepository;
  const ref = `module_${modulePath.replace(/\//g, "_")}_v0.1.0`;

  // Replace placeholders
  await replaceInFiles(modulePath, {
    module_name: moduleName,
    module_path: modulePath,
    github_repository: repository,
    ref: ref,
  });

  const executor = await aqua.NewExecutor({
    githubToken,
    cwd: modulePath,
  });

  // Run terraform-docs
  core.info("Running terraform-docs");
  let docsOutput = "";
  await executor.exec("terraform-docs", ["."], {
    cwd: modulePath,
    env: {
      GITHUB_TOKEN: githubToken,
    },
    listeners: {
      stdout: (data: Buffer) => {
        docsOutput += data.toString();
      },
    },
  });
  fs.writeFileSync(path.join(modulePath, "README.md"), docsOutput);
  core.info("Generated README.md");
};
