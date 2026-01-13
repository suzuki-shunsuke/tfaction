import * as core from "@actions/core";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { DefaultArtifactClient } from "@actions/artifact";
import * as aqua from "../aqua";
import * as lib from "../lib";
import * as getTargetConfig from "../get-target-config";
import * as conftest from "../conftest";

type Inputs = {
  githubToken: string;
  workingDirectory: string;
  renovateLogin: string;
  destroy: boolean;
  tfCommand: string;
  target: string;
  driftIssueNumber?: string;
  prAuthor?: string;
  ciInfoTempDir?: string;
  s3BucketNameTfmigrateHistory?: string;
  gcsBucketNameTfmigrateHistory?: string;
  executor: aqua.Executor;
};

type TerraformPlanOutputs = {
  detailedExitcode: number;
  planBinary: string;
  planJson: string;
  skipped?: boolean;
};

type TfmigratePlanOutputs = {
  changed?: boolean;
  planBinary?: string;
  planJson?: string;
};

const validateRenovateChange = async (inputs: Inputs): Promise<void> => {
  // Skip if not a renovate PR
  if (inputs.prAuthor !== inputs.renovateLogin) {
    return;
  }

  // Check if renovate-change label exists
  const labelsFile = path.join(inputs.ciInfoTempDir || "", "labels.txt");
  if (!fs.existsSync(labelsFile)) {
    core.warning(`Labels file not found: ${labelsFile}`);
    return;
  }

  const labels = fs.readFileSync(labelsFile, "utf8").split("\n");
  const hasRenovateChangeLabel = labels.some(
    (label) => label.trim() === "renovate-change",
  );

  if (hasRenovateChangeLabel) {
    return;
  }

  const executor = inputs.executor;

  await executor.exec(
    "github-comment",
    [
      "post",
      "-var",
      `tfaction_target:${inputs.target}`,
      "-k",
      "renovate-plan-change",
    ],
    {
      env: {
        GITHUB_TOKEN: inputs.githubToken,
        GH_COMMENT_CONFIG: lib.GitHubCommentConfig,
      },
    },
  );

  throw new Error(
    "Renovate PR must have 'No change' or 'renovate-change' label",
  );
};

const generateTfmigrateHcl = async (inputs: Inputs): Promise<boolean> => {
  const tfmigrateHclPath = path.join(inputs.workingDirectory, ".tfmigrate.hcl");

  // Check if .tfmigrate.hcl already exists
  if (fs.existsSync(tfmigrateHclPath)) {
    return false;
  }

  const installDir = process.env.TFACTION_INSTALL_DIR || "";
  let templatePath = "";
  let content = "";

  const executor = inputs.executor;

  // Generate from S3 template
  if (inputs.s3BucketNameTfmigrateHistory) {
    templatePath = path.join(installDir, "tfmigrate.hcl");
    content = fs.readFileSync(templatePath, "utf8");
    content = content.replace(/%%TARGET%%/g, inputs.target);
    content = content.replace(
      /%%S3_BUCKET_NAME_TFMIGRATE_HISTORY%%/g,
      inputs.s3BucketNameTfmigrateHistory,
    );
  }
  // Generate from GCS template
  else if (inputs.gcsBucketNameTfmigrateHistory) {
    templatePath = path.join(installDir, "tfmigrate-gcs.hcl");
    content = fs.readFileSync(templatePath, "utf8");
    content = content.replace(/%%TARGET%%/g, inputs.target);
    content = content.replace(
      /%%GCS_BUCKET_NAME_TFMIGRATE_HISTORY%%/g,
      inputs.gcsBucketNameTfmigrateHistory,
    );
  } else {
    // Error: neither S3 nor GCS bucket is configured
    await executor.exec(
      "github-comment",
      [
        "post",
        "-var",
        `tfaction_target:${inputs.target}`,
        "-k",
        "tfmigrate-hcl-not-found",
      ],
      {
        env: {
          GITHUB_TOKEN: inputs.githubToken,
          GH_COMMENT_CONFIG: lib.GitHubCommentConfig,
        },
      },
    );
    throw new Error(
      ".tfmigrate.hcl is required but neither S3 nor GCS bucket is configured",
    );
  }

  // Write .tfmigrate.hcl
  fs.writeFileSync(tfmigrateHclPath, content);
  return true;
};

export const runTfmigratePlan = async (
  inputs: Inputs,
): Promise<TfmigratePlanOutputs> => {
  // Generate .tfmigrate.hcl if it doesn't exist
  const wasCreated = await generateTfmigrateHcl(inputs);
  if (wasCreated) {
    // Early exit: .tfmigrate.hcl was just created
    core.setOutput("changed", "true");
    return { changed: true };
  }

  // Create temp directory and copy plan files
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tfaction-"));
  const tempPlanBinary = path.join(tempDir, "tfplan.binary");
  const tempPlanJson = path.join(tempDir, "tfplan.json");

  // Run tfmigrate plan
  core.startGroup("tfmigrate plan");

  const env: { [key: string]: string } = {
    GITHUB_TOKEN: inputs.githubToken,
    GH_COMMENT_CONFIG: lib.GitHubCommentConfig,
  };
  // Set TFMIGRATE_EXEC_PATH if TF_COMMAND is not "terraform"
  if (!process.env.TFMIGRATE_EXEC_PATH && inputs.tfCommand !== "terraform") {
    env.TFMIGRATE_EXEC_PATH = inputs.tfCommand;
  }

  const executor = inputs.executor;

  await executor.exec(
    "github-comment",
    [
      "exec",
      "-var",
      `tfaction_target:${inputs.target}`,
      "-k",
      "tfmigrate-plan",
      "--",
      "tfmigrate",
      "plan",
      "--out",
      tempPlanBinary,
    ],
    {
      cwd: inputs.workingDirectory,
      env: env,
    },
  );
  core.endGroup();

  // Run terraform show to convert plan to JSON
  core.startGroup(`${inputs.tfCommand} show`);

  const showResult = await executor.getExecOutput(
    "github-comment",
    ["exec", "--", inputs.tfCommand, "show", "-json", tempPlanBinary],
    {
      cwd: inputs.workingDirectory,
      env: {
        GITHUB_TOKEN: inputs.githubToken,
        GH_COMMENT_CONFIG: lib.GitHubCommentConfig,
      },
      silent: true,
    },
  );
  fs.writeFileSync(tempPlanJson, showResult.stdout);
  core.endGroup();

  core.setOutput("plan_json", tempPlanJson);
  core.setOutput("plan_binary", tempPlanBinary);

  return {
    planBinary: tempPlanBinary,
    planJson: tempPlanJson,
  };
};

export const runTerraformPlan = async (
  inputs: Inputs,
): Promise<TerraformPlanOutputs> => {
  const installDir = process.env.TFACTION_INSTALL_DIR || "";

  // Run terraform plan with tfcmt
  core.startGroup(`${inputs.tfCommand} plan`);

  // Create temp directory and copy plan binary
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tfaction-"));
  const tempPlanBinary = path.join(tempDir, "tfplan.binary");
  const tempPlanJson = path.join(tempDir, "tfplan.json");

  const planArgs = [
    "-var",
    `target:${inputs.target}`,
    "-var",
    `destroy:${inputs.destroy}`,
  ];
  // Set TFCMT_CONFIG for drift detection mode
  if (inputs.driftIssueNumber) {
    planArgs.push("-config", path.join(installDir, "tfcmt-drift.yaml"));
  }
  planArgs.push(
    "plan",
    "--",
    inputs.tfCommand,
    "plan",
    "-no-color",
    "-detailed-exitcode",
    "-out",
    tempPlanBinary,
    "-input=false",
  );
  if (inputs.destroy) {
    planArgs.push("-destroy");
    core.warning("The destroy option is enabled");
  }

  const executor = inputs.executor;

  const planResult = await executor.getExecOutput("tfcmt", planArgs, {
    cwd: inputs.workingDirectory,
    ignoreReturnCode: true,
    env: {
      GITHUB_TOKEN: inputs.githubToken,
      AQUA_GLOBAL_CONFIG: lib.aquaGlobalConfig,
      TERRAGRUNT_LOG_DISABLE: "true", // https://suzuki-shunsuke.github.io/tfcmt/terragrunt
    },
  });

  const detailedExitcode = planResult.exitCode;
  core.endGroup();

  // Set detailed_exitcode output immediately
  core.setOutput("detailed_exitcode", detailedExitcode);

  core.setOutput("plan_binary", tempPlanBinary);
  core.setOutput("plan_binary_artifact_path", tempPlanBinary); // Keep for backward compatibility

  // If terraform plan failed, exit immediately
  if (detailedExitcode === 1) {
    throw new Error("terraform plan failed");
  }

  // Run terraform show to convert plan to JSON
  core.startGroup(`${inputs.tfCommand} show`);

  const showResult = await executor.getExecOutput(
    "github-comment",
    ["exec", "--", inputs.tfCommand, "show", "-json", tempPlanBinary],
    {
      cwd: inputs.workingDirectory,
      env: {
        GITHUB_TOKEN: inputs.githubToken,
        GH_COMMENT_CONFIG: lib.GitHubCommentConfig,
      },
      silent: true,
    },
  );
  fs.writeFileSync(tempPlanJson, showResult.stdout);
  core.endGroup();

  core.setOutput("plan_json", tempPlanJson);
  core.setOutput("plan_json_artifact_path", tempPlanJson); // Keep for backward compatibility

  // Upload plan files as artifact
  core.startGroup("upload plan artifacts");
  const artifact = new DefaultArtifactClient();
  const artifactNameBinary = `terraform_plan_file_${inputs.target.replaceAll("/", "__")}`;
  core.setOutput("plan_binary_artifact_name", artifactNameBinary);
  const artifactNameJson = `terraform_plan_json_${inputs.target.replaceAll("/", "__")}`;
  core.setOutput("plan_json_artifact_name", artifactNameJson);
  await artifact.uploadArtifact(artifactNameBinary, [tempPlanBinary], tempDir);
  await artifact.uploadArtifact(artifactNameJson, [tempPlanJson], tempDir);
  core.endGroup();

  // If no changes, exit successfully
  if (detailedExitcode === 0) {
    return {
      detailedExitcode,
      planBinary: tempPlanBinary,
      planJson: tempPlanJson,
    };
  }

  // If not drift detection mode, validate renovate changes
  if (!inputs.driftIssueNumber) {
    await validateRenovateChange(inputs);
  }

  // If drift detection mode and there are changes, fail
  if (inputs.driftIssueNumber) {
    throw new Error("Drift detected: terraform plan has changes");
  }

  return {
    detailedExitcode,
    planBinary: tempPlanBinary,
    planJson: tempPlanJson,
  };
};

export const main = async (
  targetConfig: getTargetConfig.TargetConfig,
): Promise<void> => {
  const config = lib.getConfig();
  const configDir = path.dirname(config.config_path);
  const workingDir = path.join(configDir, targetConfig.working_directory);

  const githubToken = core.getInput("github_token");
  const executor = await aqua.NewExecutor({
    githubToken,
    cwd: workingDir,
  });

  const inputs: Inputs = {
    githubToken,
    workingDirectory: workingDir,
    renovateLogin: config.renovate_login || "",
    destroy: targetConfig.destroy || false,
    tfCommand: targetConfig.terraform_command || "terraform",
    target: targetConfig.target,
    driftIssueNumber: process.env.TFACTION_DRIFT_ISSUE_NUMBER,
    prAuthor: process.env.CI_INFO_PR_AUTHOR,
    ciInfoTempDir: process.env.CI_INFO_TEMP_DIR,
    s3BucketNameTfmigrateHistory: targetConfig.s3_bucket_name_tfmigrate_history,
    gcsBucketNameTfmigrateHistory:
      targetConfig.gcs_bucket_name_tfmigrate_history,
    executor,
  };

  const jobType = process.env.TFACTION_JOB_TYPE;

  let planJsonPath: string | undefined;

  switch (jobType) {
    case undefined:
      throw new Error("TFACTION_JOB_TYPE is not set");
    case "":
      throw new Error("TFACTION_JOB_TYPE is not set");
    case "tfmigrate": {
      const result = await runTfmigratePlan(inputs);
      if (result.changed) {
        // .tfmigrate.hcl was just created, skip conftest
        return;
      }
      planJsonPath = result.planJson;
      break;
    }
    case "terraform": {
      const result = await runTerraformPlan(inputs);
      planJsonPath = result.planJson;
      break;
    }
    default:
      throw new Error(`Unknown TFACTION_JOB_TYPE: ${jobType}`);
  }

  // Run conftest for plan
  if (planJsonPath) {
    await conftest.run(
      {
        configDir,
        githubToken,
        plan: true,
        planJsonPath,
        executor,
      },
      config,
      targetConfig,
    );
  }
};
