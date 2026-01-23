import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as lib from "../../lib";
import * as env from "../../lib/env";
import * as input from "../../lib/input";
import * as aqua from "../../aqua";
import * as getTargetConfig from "../../get-target-config";
import * as updateBranchAction from "@csm-actions/update-branch-action";
import * as githubAppToken from "@suzuki-shunsuke/github-app-token";
import {
  DefaultArtifactClient,
  FindOptions,
  DownloadArtifactOptions,
} from "@actions/artifact";

type WorkflowRun = {
  headSha: string;
  databaseId: number;
};

export const listRelatedPullRequests = async (
  githubToken: string,
  target: string,
): Promise<number[]> => {
  const octokit = github.getOctokit(githubToken);
  const { owner, repo } = github.context.repo;

  // Search pull requests using GraphQL
  const query = `repo:${owner}/${repo} is:pr is:open label:"${target}" -label:tfaction:disable-auto-update`;

  const result: {
    search: {
      nodes: Array<{ number: number }>;
    };
  } = await octokit.graphql(
    `
    query($q: String!) {
      search(query: $q, type: ISSUE, first: 100) {
        nodes {
          ... on PullRequest {
            number
          }
        }
      }
    }
  `,
    { q: query },
  );

  return result.search.nodes.map((pr) => pr.number);
};

export const main = async (): Promise<void> => {
  const githubToken = input.githubToken;
  const driftIssueNumber = env.tfactionDriftIssueNumber;
  const cfg = await lib.getConfig();
  const targetConfig = await getTargetConfig.getTargetConfig(
    {
      target: env.tfactionTarget,
      workingDir: env.tfactionWorkingDir,
      isApply: true,
      jobType: env.getJobType(),
    },
    cfg,
  );
  const workingDir = path.join(
    cfg.git_root_dir,
    targetConfig.working_directory,
  );
  const tfCommand = targetConfig.terraform_command || "terraform";
  const driftIssueRepo = lib.getDriftIssueRepo(cfg);
  const driftIssueRepoOwner = driftIssueRepo.owner;
  const driftIssueRepoName = driftIssueRepo.name;
  const ciInfoPrNumber = env.ciInfoPrNumber;
  const disableUpdateRelatedPullRequests = !(
    cfg.update_related_pull_requests?.enabled ?? true
  );
  const securefixServerRepository =
    cfg.securefix_action?.server_repository ?? "";
  const executor = await aqua.NewExecutor({
    githubToken: githubToken,
    cwd: workingDir,
  });
  const planFilePath = await downloadPlanFile(executor);
  if (!planFilePath) {
    throw new Error("PLAN_FILE_PATH is not set");
  }

  // Create a temporary file for apply output
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tfaction-"));
  const applyOutput = path.join(tempDir, "apply_output.txt");
  const outputStream = fs.createWriteStream(applyOutput);

  core.startGroup(`${tfCommand} apply`);

  // Run terraform apply with tfcmt
  let exitCode = 0;
  try {
    await executor
      .exec(
        "tfcmt",
        [
          "-var",
          `target:${targetConfig.target}`,
          "apply",
          "--",
          tfCommand,
          "apply",
          "-auto-approve",
          "-no-color",
          "-input=false",
          planFilePath,
        ],
        {
          cwd: workingDir,
          ignoreReturnCode: true,
          env: {
            GITHUB_TOKEN: githubToken,
            TERRAGRUNT_LOG_DISABLE: "true", // https://suzuki-shunsuke.github.io/tfcmt/terragrunt
          },
          listeners: {
            stdout: (data: Buffer) => {
              process.stdout.write(data);
              outputStream.write(data);
            },
            stderr: (data: Buffer) => {
              process.stderr.write(data);
              outputStream.write(data);
            },
          },
        },
      )
      .then((code) => {
        exitCode = code;
      });
  } finally {
    outputStream.end();
  }

  core.endGroup();

  // If this is a drift issue, post the result to the drift issue
  if (driftIssueNumber) {
    const prUrl = `${github.context.serverUrl}/${github.context.repo.owner}/${github.context.repo.repo}/pull/${ciInfoPrNumber}`;
    const tfcmtConfig = path.join(
      lib.GitHubActionPath,
      "install",
      "tfcmt-drift.yaml",
    );

    try {
      await executor.exec(
        "tfcmt",
        [
          "-config",
          tfcmtConfig,
          "-owner",
          driftIssueRepoOwner,
          "-repo",
          driftIssueRepoName,
          "-pr",
          driftIssueNumber,
          "-var",
          `pr_url:${prUrl}`,
          "-var",
          `target:${targetConfig.target}`,
          "apply",
          "--",
          "bash",
          "-c",
          `cat ${applyOutput} && exit ${exitCode}`,
        ],
        {
          cwd: workingDir,
          ignoreReturnCode: true,
          env: {
            GITHUB_TOKEN: githubToken,
          },
        },
      );
    } catch (error) {
      // Ignore the failure
      core.warning(`Failed to post to drift issue: ${error}`);
    }
  }

  // Clean up temporary file
  try {
    fs.rmdirSync(tempDir);
  } catch {
    // Ignore the failure
  }

  if (disableUpdateRelatedPullRequests) {
    core.info("Skip updating related pull requests");
  } else {
    const prNumbers = await listRelatedPullRequests(
      githubToken,
      targetConfig.target,
    );
    if (securefixServerRepository) {
      await updateBranchBySecurefix(
        github.context.repo.owner,
        securefixServerRepository,
        prNumbers,
      );
    } else {
      await updateBranchByCommit(githubToken, prNumbers);
    }
  }

  if (exitCode !== 0) {
    throw new Error("terraform apply failed");
  }
};

const revoke = async (token: githubAppToken.Token): Promise<void> => {
  if (!token) {
    return;
  }
  if (githubAppToken.hasExpired(token.expiresAt)) {
    core.info("GitHub App token has already expired");
    return;
  }
  core.info("Revoking GitHub App token");
  await githubAppToken.revoke(token.token);
};

export const updateBranchBySecurefix = async (
  serverRepoOwner: string,
  serverRepoName: string,
  prNumbers: number[],
): Promise<void> => {
  const token = await githubAppToken.create({
    appId: input.securefixActionAppId,
    privateKey: input.securefixActionAppPrivateKey,
    owner: serverRepoOwner,
    repositories: [serverRepoName],
    permissions: {
      issues: "write",
    },
  });
  try {
    const octokit = github.getOctokit(token.token);
    for (const prNumber of prNumbers) {
      try {
        core.info(
          `Updating a branch ${github.context.serverUrl}/${github.context.repo.owner}/${github.context.repo.repo}/pull/${prNumber}`,
        );
        await updateBranchAction.update({
          octokit,
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          pullRequestNumber: prNumber,
          serverRepositoryOwner: serverRepoOwner,
          serverRepositoryName: serverRepoName,
        });
      } catch (error) {
        core.warning(`Failed to update branch for PR #${prNumber}: ${error}`);
      }
    }
  } finally {
    await revoke(token);
  }
};

export const updateBranchByCommit = async (
  githubToken: string,
  prNumbers: number[],
): Promise<void> => {
  const octokit = github.getOctokit(githubToken);
  for (const prNumber of prNumbers) {
    try {
      const { data } = await octokit.rest.pulls.updateBranch({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: prNumber,
      });
      core.notice(`Updated a branch ${data.url}`);
    } catch (error) {
      core.warning(`Failed to update branch for PR #${prNumber}: ${error}`);
    }
  }
};

const downloadArtifact = async (
  token: string,
  owner: string,
  repo: string,
  runId: number,
  artifactName: string,
  dest: string,
): Promise<void> => {
  // Download a GitHub Actions Artifact
  const artifact = new DefaultArtifactClient();
  core.info(`Getting an artifact`);
  const artifactOpts: DownloadArtifactOptions & FindOptions = {
    findBy: {
      token: token,
      repositoryOwner: owner,
      repositoryName: repo,
      workflowRunId: runId,
    },
    path: dest,
  };
  const { artifact: targetArtifact } = await artifact.getArtifact(
    artifactName,
    artifactOpts,
  );
  if (!targetArtifact) {
    core.setFailed(`Artifact '${artifactName}' not found`);
    return;
  }
  core.info(`Downloading an artifact`);
  await artifact.downloadArtifact(targetArtifact.id, artifactOpts);
};

const downloadPlanFile = async (executor: aqua.Executor): Promise<string> => {
  const cfg = await lib.getConfig();
  const githubToken = core.getInput("github_token");
  const target = env.tfactionTarget;
  const planWorkflowName = cfg.plan_workflow_name;
  const ciInfoTempDir = env.ciInfoTempDir;
  const branch = env.ciInfoHeadRef;

  const filename = "tfplan.binary";
  const artifactName = `terraform_plan_file_${target.replaceAll("/", "__")}`;

  // Get PR head SHA
  const prJsonPath = path.join(ciInfoTempDir, "pr.json");
  const prJson = JSON.parse(fs.readFileSync(prJsonPath, "utf8"));
  const prHeadSha = prJson.head.sha;

  // Get workflow run
  const octokit = github.getOctokit(githubToken);
  const { data: workflowRuns } = await octokit.rest.actions.listWorkflowRuns({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    workflow_id: planWorkflowName,
    branch: branch,
    per_page: 1,
  });

  if (workflowRuns.workflow_runs.length === 0) {
    await executor.exec(
      "github-comment",
      [
        "post",
        "-var",
        `tfaction_target:${target}`,
        "-var",
        `plan_workflow_name:${planWorkflowName}`,
        "-var",
        `branch:${branch}`,
        "-k",
        "no-workflow-run-found",
      ],
      {
        env: {
          GITHUB_TOKEN: githubToken,
        },
      },
    );
    throw new Error("No workflow run is found");
  }

  const latestRun = workflowRuns.workflow_runs[0];
  const workflowRun: WorkflowRun = {
    headSha: latestRun.head_sha,
    databaseId: latestRun.id,
  };
  const runId = workflowRun.databaseId;
  const headSha = workflowRun.headSha;

  // Check if headSha matches
  if (headSha !== prHeadSha) {
    await executor.exec(
      "github-comment",
      [
        "post",
        "-var",
        `tfaction_target:${target}`,
        "-var",
        `wf_sha:${headSha}`,
        "-var",
        `pr_sha:${prHeadSha}`,
        "-k",
        "invalid-workflow-sha",
      ],
      {
        env: {
          GITHUB_TOKEN: githubToken,
        },
      },
    );
    throw new Error(
      `workflow run's headSha (${headSha}) is different from the associated pull request's head sha (${prHeadSha})`,
    );
  }

  // Download artifact
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tfaction-"));

  await downloadArtifact(
    githubToken,
    github.context.repo.owner,
    github.context.repo.repo,
    runId,
    artifactName,
    tempDir,
  );

  const sourcePath = path.join(tempDir, filename);
  return sourcePath;
};
