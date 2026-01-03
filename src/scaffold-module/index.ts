import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "fs";
import * as path from "path";

import * as lib from "../lib";

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
  pattern: string,
  replacement: string,
): Promise<void> => {
  let output = "";
  await exec.exec(
    "git",
    ["ls-files", "--modified", "--others", "--exclude-standard", "."],
    {
      cwd: workingDir,
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
      },
    },
  );

  const files = output
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => f.length > 0);

  for (const file of files) {
    const filePath = path.join(workingDir, file);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath, "utf8");
      const newContent = content.replace(new RegExp(pattern, "g"), replacement);
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent);
      }
    }
  }
};

export const main = async () => {
  const githubToken = core.getInput("github_token");

  const modulePath = process.env.TFACTION_MODULE_PATH ?? "";
  const templateDir = process.env.TFACTION_MODULE_TEMPLATE_DIR ?? "";

  // Validate inputs
  if (!modulePath) {
    throw new Error("env.TFACTION_MODULE_PATH is required");
  }
  if (!templateDir) {
    throw new Error("env.TFACTION_MODULE_TEMPLATE_DIR is required");
  }

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
  fs.writeFileSync(path.join(modulePath, "tfaction_module.yaml"), "{}");
  core.info("Created tfaction_module.yaml");

  // Get module name and path for replacements
  const moduleName = path.basename(modulePath);
  const repository = process.env.GITHUB_REPOSITORY ?? "";
  const ref = `module_${modulePath.replace(/\//g, "_")}_v0.1.0`;

  // Replace placeholders
  await replaceInFiles(modulePath, "%%MODULE_NAME%%", moduleName);
  core.info("Replaced MODULE_NAME placeholder");

  await replaceInFiles(modulePath, "%%MODULE_PATH%%", modulePath);
  core.info("Replaced MODULE_PATH placeholder");

  await replaceInFiles(modulePath, "%%GITHUB_REPOSITORY%%", repository);
  core.info("Replaced GITHUB_REPOSITORY placeholder");

  await replaceInFiles(modulePath, "%%REF%%", ref);
  core.info("Replaced REF placeholder");

  // Install aqua packages
  core.info("Installing aqua packages");
  await exec.exec("aqua", ["i", "-l", "-a"], {
    cwd: modulePath,
    env: {
      ...process.env,
      AQUA_GLOBAL_CONFIG: lib.aquaGlobalConfig,
    },
  });

  // Run terraform-docs
  core.info("Running terraform-docs");
  let docsOutput = "";
  await exec.exec("terraform-docs", ["."], {
    cwd: modulePath,
    env: {
      ...process.env,
      GITHUB_TOKEN: githubToken,
      AQUA_GLOBAL_CONFIG: lib.aquaGlobalConfig,
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
