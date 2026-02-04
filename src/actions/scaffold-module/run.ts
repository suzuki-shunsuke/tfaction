import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import Handlebars from "handlebars";

import * as aqua from "../../aqua";
import * as lib from "../../lib";
import * as git from "../../lib/git";

export interface RunInput {
  githubToken: string;
  modulePath: string;
  moduleTemplateDir: string;
  repository: string;
}

export const copyDirectory = (src: string, dest: string): void => {
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

export const replaceInFiles = async (
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

export const run = async (input: RunInput): Promise<void> => {
  const config = await lib.getConfig();

  if (!input.modulePath) {
    throw new Error("env.TFACTION_MODULE_PATH is required");
  }
  if (!input.moduleTemplateDir) {
    throw new Error("env.TFACTION_MODULE_TEMPLATE_DIR is required");
  }

  const modulePath = path.join(config.git_root_dir, input.modulePath);
  const templateDir = path.join(config.git_root_dir, input.moduleTemplateDir);

  if (fs.existsSync(modulePath)) {
    throw new Error(`file exists: ${modulePath}`);
  }

  if (!fs.existsSync(templateDir) || !fs.statSync(templateDir).isDirectory()) {
    throw new Error(`${templateDir} doesn't exist`);
  }

  const parentDir = path.dirname(modulePath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
    core.info(`Created parent directory: ${parentDir}`);
  }

  copyDirectory(templateDir, modulePath);
  core.info(`Copied template from ${templateDir} to ${modulePath}`);

  fs.writeFileSync(path.join(modulePath, "tfaction_module.yaml"), "{}\n");
  core.info("Created tfaction_module.yaml");

  const moduleName = path.basename(modulePath);
  const repository = input.repository;
  const ref = `module_${modulePath.replace(/\//g, "_")}_v0.1.0`;

  await replaceInFiles(modulePath, {
    module_name: moduleName,
    module_path: modulePath,
    github_repository: repository,
    ref: ref,
  });

  const executor = await aqua.NewExecutor({
    githubToken: input.githubToken,
    cwd: modulePath,
  });

  core.info("Running terraform-docs");
  let docsOutput = "";
  await executor.exec("terraform-docs", ["."], {
    cwd: modulePath,
    env: {
      GITHUB_TOKEN: input.githubToken,
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
