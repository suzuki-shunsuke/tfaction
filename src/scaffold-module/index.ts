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
  const githubToken = core.getInput("github_token", { required: true });

  const modulePath = process.env.TFACTION_MODULE_PATH ?? "";
  const templateDir = process.env.TFACTION_MODULE_TEMPLATE_DIR ?? "";
  const skipAddingAquaPackages =
    process.env.TFACTION_SKIP_ADDING_AQUA_PACKAGES === "true";

  // Validate inputs
  if (!githubToken) {
    throw new Error("github_token is required");
  }
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

  const config = lib.getConfig();
  const enableTfsec = config.tfsec?.enabled ?? false;
  const enableTrivy = config.trivy?.enabled ?? true;
  const enableTflint = config.tflint?.enabled ?? true;

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

  // Add aqua packages if not skipped
  if (!skipAddingAquaPackages) {
    core.info("Initializing aqua");
    await exec.exec("aqua", ["init"], { cwd: modulePath });

    core.info("Adding hashicorp/terraform to aqua");
    await exec.exec("aqua", ["g", "-i", "hashicorp/terraform"], {
      cwd: modulePath,
    });

    if (enableTfsec) {
      core.info("Adding aquasecurity/tfsec to aqua");
      await exec.exec("aqua", ["g", "-i", "aquasecurity/tfsec"], {
        cwd: modulePath,
      });
    }

    if (enableTrivy) {
      core.info("Adding aquasecurity/trivy to aqua");
      await exec.exec("aqua", ["g", "-i", "aquasecurity/trivy"], {
        cwd: modulePath,
      });
    }

    if (enableTflint) {
      core.info("Adding terraform-linters/tflint to aqua");
      await exec.exec("aqua", ["g", "-i", "terraform-linters/tflint"], {
        cwd: modulePath,
      });
    }
  }

  // Install aqua packages
  core.info("Installing aqua packages");
  await exec.exec("aqua", ["i", "-l", "-a"], { cwd: modulePath });

  // Run terraform-docs
  core.info("Running terraform-docs");
  let docsOutput = "";
  await exec.exec("terraform-docs", ["."], {
    cwd: modulePath,
    listeners: {
      stdout: (data: Buffer) => {
        docsOutput += data.toString();
      },
    },
  });
  fs.writeFileSync(path.join(modulePath, "README.md"), docsOutput);
  core.info("Generated README.md");
};
