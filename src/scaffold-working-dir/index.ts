import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "fs";
import * as path from "path";
import Handlebars from "handlebars";

import * as lib from "../lib";
import * as getTargetConfig from "../get-target-config";

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

const replaceInFiles = async (workingDir: string, vars: any): Promise<void> => {
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
      const newContent = Handlebars.compile(content)(vars);
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
  const actionPath = lib.GitHubActionPath;

  // Create parent directory
  const parentDir = path.dirname(workingDir);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
    core.info(`Created parent directory: ${parentDir}`);
  }

  // Copy template directory
  if (templateDir) {
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
    fs.copyFileSync(
      path.join(actionPath, "install", "tfmigrate.hcl"),
      tfmigrateHclPath,
    );
    core.info("Copied tfmigrate.hcl for S3 backend");
  }

  // Copy tfmigrate-gcs.hcl if GCS bucket is configured
  if (gcsBucket) {
    const tfmigrateHclPath = path.join(workingDir, ".tfmigrate.hcl");
    fs.copyFileSync(
      path.join(actionPath, "install", "tfmigrate-gcs.hcl"),
      tfmigrateHclPath,
    );
    core.info("Copied tfmigrate.hcl for GCS backend");
  }

  // Replace placeholders in files
  await replaceInFiles(workingDir, {
    s3_bucket_name_for_tfmigrate_history: s3Bucket,
    gcs_bucket_name_for_tfmigrate_history: gcsBucket,
    working_directory: workingDir,
    target,
  });

  // Set output
  core.setOutput("working_directory", workingDir);
};
