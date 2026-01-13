import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as github from "@actions/github";
import * as fs from "fs";
import * as path from "path";
import Handlebars from "handlebars";

import * as lib from "../lib";
import * as aqua from "../aqua";
import { getTargetConfig } from "../get-target-config";
import * as commit from "../commit";

type Octokit = ReturnType<typeof github.getOctokit>;

const generateBranchName = (target: string, prNumber: string): string => {
  if (prNumber) {
    return ""; // Will be determined after checkout
  }
  const now = new Date();
  const timestamp =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0") +
    "T" +
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0") +
    now.getSeconds().toString().padStart(2, "0");
  return `scaffold-tfmigrate-${target}-${timestamp}`;
};

const getCurrentBranch = async (): Promise<string> => {
  let output = "";
  await exec.exec("git", ["branch", "--show-current"], {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
    },
  });
  return output.trim();
};

const getModifiedFiles = async (workingDir: string): Promise<string[]> => {
  let output = "";
  await exec.exec(
    "git",
    ["ls-files", "--modified", "--others", "--exclude-standard", workingDir],
    {
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
      },
    },
  );
  return output
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
};

const createTfmigrateHcl = (
  workingDir: string,
  target: string,
  s3Bucket: string | undefined,
  gcsBucket: string | undefined,
  actionPath: string,
): void => {
  const tfmigrateHclPath = path.join(workingDir, ".tfmigrate.hcl");
  if (fs.existsSync(tfmigrateHclPath)) {
    core.info(".tfmigrate.hcl already exists, skipping");
    return;
  }

  if (s3Bucket) {
    const template = fs.readFileSync(
      path.join(actionPath, "tfmigrate.hcl"),
      "utf8",
    );

    const content = Handlebars.compile(template)({
      target,
      s3_bucket_name_for_tfmigrate_history: s3Bucket,
    });
    fs.writeFileSync(tfmigrateHclPath, content);
    core.info(`Created .tfmigrate.hcl with S3 backend`);
  } else if (gcsBucket) {
    const template = fs.readFileSync(
      path.join(actionPath, "tfmigrate-gcs.hcl"),
      "utf8",
    );
    const content = Handlebars.compile(template)({
      target,
      gcs_bucket_name_for_tfmigrate_history: gcsBucket,
    });
    fs.writeFileSync(tfmigrateHclPath, content);
    core.info(`Created .tfmigrate.hcl with GCS backend`);
  }
};

const createMigrationFile = (
  workingDir: string,
  migrationName: string,
  actionPath: string,
): void => {
  const tfmigrateDir = path.join(workingDir, "tfmigrate");
  if (!fs.existsSync(tfmigrateDir)) {
    fs.mkdirSync(tfmigrateDir, { recursive: true });
  }

  const template = fs.readFileSync(
    path.join(actionPath, "migration.hcl"),
    "utf8",
  );
  const content = Handlebars.compile(template)({
    migration_name: migrationName,
  });

  const now = new Date();
  const timestamp =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0") +
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0") +
    now.getSeconds().toString().padStart(2, "0");
  const migrationFilePath = path.join(
    tfmigrateDir,
    `${timestamp}_${migrationName}.hcl`,
  );

  fs.writeFileSync(migrationFilePath, content);
  core.info(`Created migration file: ${migrationFilePath}`);
};

const outputSkipCreatePrGuide = (
  label: string,
  branch: string,
  target: string,
  draftPr: boolean,
): void => {
  const draftFlag = draftPr ? "-d " : "";
  const serverUrl = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const repository = process.env.GITHUB_REPOSITORY ?? "";
  const runId = process.env.GITHUB_RUN_ID ?? "";

  const guide = `
## Create a pull request

Please run the following command in your terminal.

\`\`\`
gh pr create -R "${repository}" ${draftFlag}\\
  -l "${label}" \\
  -H "${branch}" \\
  -t "Scaffold tfmigrate migration (${target})" \\
  -b "This pull request was created by [GitHub Actions](${serverUrl}/${repository}/actions/runs/${runId}). About tfmigrate, please see https://github.com/minamijoyo/tfmigrate [tfaction - tfmigrate](https://suzuki-shunsuke.github.io/tfaction/docs/feature/tfmigrate)"
\`\`\`

Then please fix the generated migration file.

[Reference](https://suzuki-shunsuke.github.io/tfaction/docs/feature/skip-creating-pr)
`;

  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY ?? "", guide);
  core.info("Output skip-create-pr guide to GitHub Step Summary");
};

const addLabelToPR = async (
  octokit: Octokit,
  prNumber: string,
  label: string,
): Promise<void> => {
  await octokit.rest.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: parseInt(prNumber, 10),
    labels: [label],
  });
  core.info(`Added label ${label} to PR #${prNumber}`);
};

const createLabel = async (octokit: Octokit, label: string): Promise<void> => {
  try {
    await octokit.rest.issues.createLabel({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      name: label,
    });
    core.info(`Created label: ${label}`);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "status" in error &&
      (error as { status: number }).status === 422
    ) {
      core.info(`Label ${label} already exists`);
    } else {
      throw error;
    }
  }
};

export const main = async () => {
  const githubToken = core.getInput("github_token");
  const migrationName = core.getInput("migration_name") || "main";
  const prNumber = core.getInput("pr_number") || "";
  const securefixAppId = core.getInput("securefix_action_app_id");
  const securefixAppPrivateKey = core.getInput(
    "securefix_action_app_private_key",
  );

  const octokit = github.getOctokit(githubToken);
  const actionPath = lib.GitHubActionPath;

  // Get config
  const config = lib.getConfig();
  const targetConfig = await getTargetConfig(
    {
      target: lib.getTargetFromEnv(),
      workingDir: lib.getWorkingDirFromEnv(),
      isApply: false,
      jobType: "scaffold_working_dir",
    },
    config,
  );

  const workingDir = targetConfig.working_directory;
  const target = targetConfig.target;

  const skipCreatePr = config.skip_create_pr;
  const draftPr = config.draft_pr;
  const labelPrefix = config.label_prefixes.tfmigrate;
  const securefixServerRepository = config.securefix_action?.server_repository;
  const securefixPRBaseBranch =
    config.securefix_action?.pull_request?.base_branch ?? "";

  const label = `${labelPrefix}${target}`;
  const actor = process.env.GITHUB_ACTOR ?? "";
  const serverUrl = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const repository = process.env.GITHUB_REPOSITORY ?? "";
  const runId = process.env.GITHUB_RUN_ID ?? "";

  const executor = await aqua.NewExecutor({
    githubToken,
  });

  // Checkout PR if pr_number is provided
  let branch = generateBranchName(target, prNumber);
  if (prNumber) {
    await executor.exec("gh", ["pr", "checkout", prNumber], {
      env: {
        ...process.env,
        GITHUB_TOKEN: githubToken,
        AQUA_GLOBAL_CONFIG: lib.aquaGlobalConfig,
      },
    });
    branch = await getCurrentBranch();
  }

  // Create directory
  const parentDir = path.dirname(workingDir);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  if (!fs.existsSync(workingDir)) {
    fs.mkdirSync(workingDir, { recursive: true });
  }

  // Create .tfmigrate.hcl
  createTfmigrateHcl(
    workingDir,
    target,
    targetConfig.s3_bucket_name_tfmigrate_history,
    targetConfig.gcs_bucket_name_tfmigrate_history,
    actionPath,
  );

  // Create migration file
  createMigrationFile(workingDir, migrationName, actionPath);

  // Get modified files
  const files = await getModifiedFiles(workingDir);
  if (files.length === 0) {
    core.info("No files to commit");
    return;
  }

  const commitMessage = `chore: scaffold a tfmigrate migration (${target})`;
  const prTitle = `Scaffold a tfmigrate migration (${target})`;
  const prBody = `@${actor} This pull request was created by [GitHub Actions workflow_dispatch event](${serverUrl}/${repository}/actions/runs/${runId})
About tfmigrate, please see https://github.com/minamijoyo/tfmigrate
[tfaction - tfmigrate](https://suzuki-shunsuke.github.io/tfaction/docs/feature/tfmigrate)
Please fix the generated migration file.`;
  const prComment = `@${actor} This pull request was created by [GitHub Actions](${serverUrl}/${repository}/actions/runs/${runId}) you ran.
Please handle this pull request.`;

  const shouldSkipPr = skipCreatePr || !!prNumber;
  await commit.create({
    commitMessage,
    githubToken,
    files: new Set(files),
    serverRepository: securefixServerRepository ?? "",
    appId: securefixAppId,
    appPrivateKey: securefixAppPrivateKey,
    branch,
    pr: shouldSkipPr
      ? undefined
      : {
          title: prTitle,
          body: prBody,
          base: securefixPRBaseBranch,
          labels: label ? [label] : undefined,
          assignees: actor ? [actor] : undefined,
          draft: draftPr,
          comment: prComment,
        },
  });

  // Handle skip_create_pr case
  if (skipCreatePr && !prNumber) {
    await createLabel(octokit, label);
    outputSkipCreatePrGuide(label, branch, target, draftPr);
  }

  // Add label to existing PR
  if (prNumber) {
    await addLabelToPR(octokit, prNumber, label);
  }

  // Set output
  core.setOutput("working_directory", workingDir);
};
