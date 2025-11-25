import * as exec from "@actions/exec";
import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as lib from "../lib";
import * as getGlobalConfig from "../get-global-config";
import * as getTargetConfig from "../get-target-config";
import * as updateBranchAction from "@csm-actions/update-branch-action";
import * as githubAppToken from "@suzuki-shunsuke/github-app-token";

const listRelatedPullRequests = async (
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
    query($query: String!) {
      search(query: $query, type: ISSUE, first: 100) {
        nodes {
          ... on PullRequest {
            number
          }
        }
      }
    }
  `,
    { query },
  );

  return result.search.nodes.map((pr) => pr.number);
};

export const main = async (): Promise<void> => {
  const driftIssueNumber = process.env.TFACTION_DRIFT_ISSUE_NUMBER || "";
  const cfg = lib.getConfig();
  const globalConfig = await getGlobalConfig.main_(cfg, {
    drift_issue_number: driftIssueNumber,
  });
  const target = lib.getTarget();
  if (!target) {
    throw new Error("TFACTION_TARGET is not set");
  }
  const targetConfig = await getTargetConfig.run(
    {
      target: target,
      workingDir: lib.getWorkingDir(),
      isApply: true,
      jobType: lib.getJobType(),
    },
    cfg,
  );
  const tfCommand =
    targetConfig.outputs.get("terraform_command") || "terraform";
  const driftIssueRepoOwner = globalConfig.outputs.drift_issue_repo_owner;
  const driftIssueRepoName = globalConfig.outputs.drift_issue_repo_name;
  const ciInfoPrNumber = process.env.CI_INFO_PR_NUMBER || "";
  const disableUpdateRelatedPullRequests =
    globalConfig.outputs.disable_update_related_pull_requests;
  const installDir = process.env.TFACTION_INSTALL_DIR || "";
  const planFilePath = process.env.PLAN_FILE_PATH || "";
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
    await exec
      .exec(
        "tfcmt",
        [
          "-var",
          `target:${target}`,
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
          ignoreReturnCode: true,
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
    const tfcmtConfig = path.join(installDir, "tfcmt-drift.yaml");

    try {
      await exec.exec(
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
          `target:${target}`,
          "apply",
          "--",
          "bash",
          "-c",
          `cat ${applyOutput} && exit ${exitCode}`,
        ],
        {
          ignoreReturnCode: true,
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
  } catch (error) {
    // Ignore the failure
  }

  if (disableUpdateRelatedPullRequests) {
    core.notice("Skip updating related pull requests");
  } else {
    const githubToken = process.env.GITHUB_TOKEN || "";
    const prNumbers = await listRelatedPullRequests(githubToken, target);
    if (globalConfig.outputs.securefix_action_server_repository) {
      await updateBranchBySecurefix(globalConfig, prNumbers);
    } else {
      await updateBranchByCommit(githubToken, prNumbers);
    }
  }

  if (exitCode !== 0) {
    throw new Error("terraform apply failed");
  }
};

export const updateBranchBySecurefix = async (
  globalConfig: getGlobalConfig.Result,
  prNumbers: number[],
): Promise<void> => {
  const serverRepoOwner =
    globalConfig.outputs.securefix_action_server_repository.split("/")[0];
  const serverRepoName =
    globalConfig.outputs.securefix_action_server_repository.split("/")[1];
  const token = await githubAppToken.create({
    appId: core.getInput("securefix_action_app_id"),
    privateKey: core.getInput("securefix_action_app_private_key"),
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
        await updateBranchAction.update({
          octokit,
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          pullRequestNumber: prNumber,
          serverRepositoryOwner: serverRepoOwner,
          serverRepositoryName: serverRepoName,
        });
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
  } finally {
    if (!token) {
      return;
    }
    if (githubAppToken.hasExpired(token.expiresAt)) {
      core.info("GitHub App token has already expired");
      return;
    }
    core.info("Revoking GitHub App token");
    await githubAppToken.revoke(token.token);
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
