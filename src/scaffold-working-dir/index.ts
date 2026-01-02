import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import * as lib from "../lib";
import * as getTargetConfig from "../get-target-config";

const getActionPath = (): string => {
  const currentFilePath = fileURLToPath(import.meta.url);
  // Navigate from dist/index.js to scaffold-working-dir/
  return path.join(path.dirname(currentFilePath), "..", "scaffold-working-dir");
};

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
  // Get list of modified and new files
  let output = "";
  await exec.exec(
    "git",
    ["ls-files", "--modified", "--others", "--exclude-standard"],
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
  const config = lib.getConfig();
  const targetConfig = await getTargetConfig.getTargetConfig(
    {
      target: process.env.TFACTION_TARGET,
      workingDir: process.env.TFACTION_WORKING_DIR,
      isApply: false,
      jobType: "scaffold_working_dir",
    },
    config,
  );

  const workingDir = targetConfig.working_directory;
  const target = targetConfig.target;
  const templateDir = targetConfig.template_dir;
  const s3Bucket = targetConfig.s3_bucket_name_tfmigrate_history;
  const gcsBucket = targetConfig.gcs_bucket_name_tfmigrate_history;
  const workingDirectoryFile = config.working_directory_file;
  const actionPath = getActionPath();

  // Create parent directory
  const parentDir = path.dirname(workingDir);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
    core.info(`Created parent directory: ${parentDir}`);
  }

  // Copy template directory if it exists
  if (templateDir && fs.existsSync(templateDir)) {
    copyDirectory(templateDir, workingDir);
    core.info(`Copied template from ${templateDir} to ${workingDir}`);
  } else if (!fs.existsSync(workingDir)) {
    fs.mkdirSync(workingDir, { recursive: true });
    core.info(`Created working directory: ${workingDir}`);
  }

  // Create working directory file (e.g., tfaction.yaml)
  const wdFilePath = path.join(workingDir, workingDirectoryFile);
  fs.writeFileSync(wdFilePath, "{}");
  core.info(`Created ${workingDirectoryFile}`);

  // Copy tfmigrate.hcl if S3 bucket is configured
  if (s3Bucket) {
    const tfmigrateHclPath = path.join(workingDir, ".tfmigrate.hcl");
    fs.copyFileSync(path.join(actionPath, "tfmigrate.hcl"), tfmigrateHclPath);
    core.info("Copied tfmigrate.hcl for S3 backend");
  }

  // Copy tfmigrate-gcs.hcl if GCS bucket is configured
  if (gcsBucket) {
    const tfmigrateHclPath = path.join(workingDir, ".tfmigrate.hcl");
    fs.copyFileSync(
      path.join(actionPath, "tfmigrate-gcs.hcl"),
      tfmigrateHclPath,
    );
    core.info("Copied tfmigrate.hcl for GCS backend");
  }

  // Replace placeholders in files
  if (s3Bucket) {
    await replaceInFiles(
      workingDir,
      "%%S3_BUCKET_NAME_TFMIGRATE_HISTORY%%",
      s3Bucket,
    );
    core.info("Replaced S3 bucket placeholder");
  }

  if (gcsBucket) {
    await replaceInFiles(
      workingDir,
      "%%GCS_BUCKET_NAME_TFMIGRATE_HISTORY%%",
      gcsBucket,
    );
    core.info("Replaced GCS bucket placeholder");
  }

  // Replace target placeholder
  await replaceInFiles(workingDir, "%%TARGET%%", target);
  core.info("Replaced TARGET placeholder");

  // Set output
  core.setOutput("working_directory", workingDir);
};
