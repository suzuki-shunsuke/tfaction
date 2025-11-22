import * as exec from "@actions/exec";
import * as core from "@actions/core";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

type Inputs = {
  githubToken: string;
  workingDirectory: string;
  rootDir: string;
  prNumber?: string;
  renovateLogin: string;
  headSha?: string;
  destroy: boolean;
  conftestPolicyDirectory?: string;
  tfCommand: string;
  target: string;
  driftIssueNumber?: string;
  prAuthor?: string;
  ciInfoTempDir?: string;
};

type TerraformPlanOutputs = {
  detailedExitcode: number;
  planBinary: string;
  planJson: string;
  skipped?: boolean;
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
  const githubActionPath = process.env.GITHUB_ACTION_PATH || "";
  const commentConfig = path.join(githubActionPath, "github-comment.yaml");

  await exec.exec(
    "github-comment",
    [
      "post",
      "--config",
      commentConfig,
      "-var",
      `tfaction_target:${inputs.target}`,
      "-k",
      "renovate-plan-change",
    ],
    {
      env: {
        ...process.env,
        GITHUB_TOKEN: inputs.githubToken,
      },
    },
  );

  throw new Error(
    "Renovate PR must have 'No change' or 'renovate-change' label",
  );
};

export const runTerraformPlan = async (
  inputs: Inputs,
): Promise<TerraformPlanOutputs> => {
  const githubActionPath = process.env.GITHUB_ACTION_PATH || "";

  // Run terraform plan with tfcmt
  core.startGroup(`${inputs.tfCommand} plan`);

  const planBinaryPath = path.join(inputs.workingDirectory, "tfplan.binary");
  const planArgs = [
    "-var",
    `target:${inputs.target}`,
    "-var",
    `destroy:${inputs.destroy}`,
  ];
  // Set TFCMT_CONFIG for drift detection mode
  if (inputs.driftIssueNumber) {
    planArgs.push("-config", path.join(githubActionPath, "tfcmt-drift.yaml"));
  }
  planArgs.push(
    "plan",
    "--",
    inputs.tfCommand,
    "plan",
    "-no-color",
    "-detailed-exitcode",
    "-out",
    planBinaryPath,
    "-input=false",
  );
  if (inputs.destroy) {
    planArgs.push("-destroy");
    core.warning("The destroy option is enabled");
  }

  const planResult = await exec.getExecOutput("tfcmt", planArgs, {
    cwd: inputs.workingDirectory,
    ignoreReturnCode: true,
    env: {
      ...process.env,
      GITHUB_TOKEN: inputs.githubToken,
    },
  });

  const detailedExitcode = planResult.exitCode;
  core.endGroup();

  // Set detailed_exitcode output immediately
  core.setOutput("detailed_exitcode", detailedExitcode);

  // Create temp directory and copy plan binary
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tfaction-"));
  const tempPlanBinary = path.join(tempDir, "tfplan.binary");
  fs.copyFileSync(planBinaryPath, tempPlanBinary);
  core.setOutput("plan_binary", tempPlanBinary);

  // If terraform plan failed, exit immediately
  if (detailedExitcode === 1) {
    throw new Error("terraform plan failed");
  }

  // Run terraform show to convert plan to JSON
  core.startGroup(`${inputs.tfCommand} show`);
  const planJsonPath = path.join(inputs.workingDirectory, "tfplan.json");

  await exec.exec(
    "github-comment",
    ["exec", "--", inputs.tfCommand, "show", "-json", "tfplan.binary"],
    {
      cwd: inputs.workingDirectory,
      env: {
        ...process.env,
        GITHUB_TOKEN: inputs.githubToken,
      },
      outStream: fs.createWriteStream(planJsonPath),
    },
  );
  core.endGroup();

  const tempPlanJson = path.join(tempDir, "tfplan.json");
  fs.copyFileSync(planJsonPath, tempPlanJson);
  core.setOutput("plan_json", tempPlanJson);

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

export const main = async (): Promise<void> => {
  const inputs: Inputs = {
    githubToken: core.getInput("github_token"),
    workingDirectory: core.getInput("working_directory") || process.cwd(),
    rootDir: process.env.ROOT_DIR || process.env.GITHUB_WORKSPACE || "",
    prNumber: process.env.PR_NUMBER,
    renovateLogin: process.env.RENOVATE_LOGIN || "",
    headSha: process.env.HEAD_SHA,
    destroy: process.env.DESTROY === "true",
    conftestPolicyDirectory: process.env.CONFTEST_POLICY_DIRECTORY,
    tfCommand: process.env.TF_COMMAND || "terraform",
    target: process.env.TFACTION_TARGET || "",
    driftIssueNumber: process.env.TFACTION_DRIFT_ISSUE_NUMBER,
    prAuthor: process.env.CI_INFO_PR_AUTHOR,
    ciInfoTempDir: process.env.CI_INFO_TEMP_DIR,
  };

  await runTerraformPlan(inputs);
};
