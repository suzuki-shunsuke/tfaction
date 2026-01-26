import * as exec from "@actions/exec";
import * as github from "@actions/github";
import * as fs from "fs";
import * as tmp from "tmp";
import * as path from "path";
import type * as aqua from "../aqua";
import * as commit from "../commit";
import * as env from "../lib/env";

export type FileSystem = {
  existsSync: (path: string) => boolean;
  readFileSync: (path: string, encoding: BufferEncoding) => string;
  writeFileSync: (path: string, data: string) => void;
};

export type TempFile = {
  name: string;
  removeCallback: () => void;
};

export type RunInput = {
  workingDirectory: string;
  repoRoot: string;
  githubToken: string;
  securefixActionAppId: string;
  securefixActionAppPrivateKey: string;
  securefixActionServerRepository: string;
  executor: aqua.Executor;
  eventName?: string;
  tfactionTarget?: string;
  fileSystem?: FileSystem;
  createTempFile?: () => TempFile;
  commitCreate?: typeof commit.create;
  execGetExecOutput?: typeof exec.getExecOutput;
};

export const findConfigFile = (
  workingDirectory: string,
  repositoryRoot: string,
  fs: FileSystem,
): string => {
  const configFiles = [
    ".terraform-docs.yml",
    ".terraform-docs.yaml",
    ".config/.terraform-docs.yml",
    ".config/.terraform-docs.yaml",
  ];

  // Search in working directory first
  for (const file of configFiles) {
    const configPath = path.join(workingDirectory, file);
    if (fs.existsSync(configPath)) {
      return file;
    }
  }

  // If not found, search in repository root
  for (const file of configFiles) {
    const configPath = path.join(repositoryRoot, file);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }

  return "";
};

export const run = async (input: RunInput): Promise<void> => {
  const readmePath = path.join(input.workingDirectory, "README.md");
  const executor = input.executor;
  const eventName = input.eventName ?? github.context.eventName;
  const tfactionTarget = input.tfactionTarget ?? env.all.TFACTION_TARGET;
  const fileSystem = input.fileSystem ?? {
    existsSync: fs.existsSync,
    readFileSync: fs.readFileSync,
    writeFileSync: fs.writeFileSync,
  };
  const createTempFile = input.createTempFile ?? (() => tmp.fileSync());
  const commitCreate = input.commitCreate ?? commit.create;
  const execGetExecOutput = input.execGetExecOutput ?? exec.getExecOutput;

  // Check if README.md exists
  const created = !fileSystem.existsSync(readmePath);

  // Create temporary file
  const tempFile = createTempFile();
  try {
    // Check terraform-docs version
    await executor.exec("terraform-docs", ["-v"], {
      cwd: input.workingDirectory,
    });

    // Search for config file
    const config = findConfigFile(
      input.workingDirectory,
      input.repoRoot,
      fileSystem,
    );

    // Build terraform-docs arguments
    const opts = config ? ["-c", config] : ["markdown"];

    // Execute terraform-docs via github-comment
    const result = await executor.getExecOutput(
      "terraform-docs",
      [...opts, "."],
      {
        cwd: input.workingDirectory,
        ignoreReturnCode: true,
        comment: {
          token: input.githubToken,
          vars: {
            tfaction_target: tfactionTarget,
          },
        },
      },
    );

    // Write output to temp file
    fileSystem.writeFileSync(tempFile.name, result.stdout);

    // Check if command failed
    if (result.exitCode !== 0) {
      throw new Error(
        `terraform-docs failed with exit code ${result.exitCode}`,
      );
    }

    // Check for error: .terraform-docs.yml is required
    const output = fileSystem.readFileSync(tempFile.name, "utf8");
    if (output.includes("Available Commands:")) {
      throw new Error(".terraform-docs.yml is required");
    }

    // Check if README.md has the BEGIN_TF_DOCS marker
    // If not, write the entire output to README.md
    if (
      !fileSystem.existsSync(readmePath) ||
      !fileSystem
        .readFileSync(readmePath, "utf8")
        .includes("<!-- BEGIN_TF_DOCS -->")
    ) {
      fileSystem.writeFileSync(readmePath, output);
    }

    // Check if README.md has changed
    const diffResult = await execGetExecOutput(
      "git",
      ["diff", "--quiet", "README.md"],
      {
        cwd: input.workingDirectory,
        ignoreReturnCode: true,
      },
    );

    const changed = created || diffResult.exitCode !== 0;

    if (changed) {
      if (eventName !== "pull_request" && eventName !== "pull_request_target") {
        throw new Error(
          "Please generate Module's README.md with terraform-docs.",
        );
      }
      await commitCreate({
        githubToken: input.githubToken,
        commitMessage: "docs: generate document by terraform-docs",
        appId: input.securefixActionAppId,
        appPrivateKey: input.securefixActionAppPrivateKey,
        serverRepository: input.securefixActionServerRepository,
        files: new Set([path.join(input.workingDirectory, "README.md")]),
      });
      throw new Error("document is generated by terraform-docs");
    }
  } finally {
    // Clean up temporary file
    tempFile.removeCallback();
  }
};
