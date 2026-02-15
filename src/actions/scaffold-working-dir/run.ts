import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import Handlebars from "handlebars";

import * as aqua from "../../aqua";
import * as lib from "../../lib";
import * as git from "../../lib/git";
import * as getTargetConfig from "../get-target-config";

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
  vars: Record<string, string | undefined>,
): Promise<void> => {
  // Get list of modified and new files
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

export interface RunInput {
  target: string;
  workingDir: string;
  githubToken?: string;
  repository?: string;
}

export const run = async (input: RunInput): Promise<void> => {
  const config = await lib.getConfig();
  const targetConfig = await getTargetConfig.getTargetConfig(
    {
      target: input.target,
      workingDir: input.workingDir,
      isApply: false,
      jobType: "scaffold_working_dir",
    },
    config,
  );

  const isModule = targetConfig.type === "module";
  const workingDir = path.join(
    config.git_root_dir,
    targetConfig.working_directory,
  );
  const target = targetConfig.target;
  const templateDir = targetConfig.template_dir
    ? path.join(config.git_root_dir, targetConfig.template_dir)
    : undefined;
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
  if (isModule) {
    fs.writeFileSync(wdFilePath, "type: module\n");
    core.info(`Created ${workingDirectoryFile} with type: module`);
  } else {
    fs.writeFileSync(wdFilePath, "{}\n");
    core.info(`Created ${workingDirectoryFile}`);
  }

  if (!isModule) {
    const s3Bucket = targetConfig.s3_bucket_name_tfmigrate_history;
    const gcsBucket = targetConfig.gcs_bucket_name_tfmigrate_history;

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
  }

  // Replace placeholders in files
  if (isModule) {
    const moduleName = path.basename(workingDir);
    const ref = `module_${targetConfig.working_directory.replace(/\//g, "_")}_v0.1.0`;
    await replaceInFiles(workingDir, {
      module_name: moduleName,
      module_path: workingDir,
      github_repository: input.repository,
      ref,
    });
  } else {
    await replaceInFiles(workingDir, {
      s3_bucket_name_for_tfmigrate_history:
        targetConfig.s3_bucket_name_tfmigrate_history,
      gcs_bucket_name_for_tfmigrate_history:
        targetConfig.gcs_bucket_name_tfmigrate_history,
      working_directory: workingDir,
      target,
    });
  }

  // For modules, run terraform-docs if enabled
  if (isModule && targetConfig.enable_terraform_docs && input.githubToken) {
    const executor = await aqua.NewExecutor({
      githubToken: input.githubToken,
      cwd: workingDir,
    });

    core.info("Running terraform-docs");
    let docsOutput = "";
    await executor.exec("terraform-docs", ["."], {
      cwd: workingDir,
      env: {
        GITHUB_TOKEN: input.githubToken,
      },
      listeners: {
        stdout: (data: Buffer) => {
          docsOutput += data.toString();
        },
      },
    });
    fs.writeFileSync(path.join(workingDir, "README.md"), docsOutput);
    core.info("Generated README.md");
  }

  // Set output
  core.setOutput("working_directory", workingDir);
};
