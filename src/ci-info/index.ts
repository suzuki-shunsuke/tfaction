import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import * as env from "../lib/env";
import * as input from "../lib/input";

export interface PRFile {
  filename: string;
  previous_filename?: string;
}

export type Logger = {
  info: (message: string) => void;
  warning: (message: string) => void;
};

export const getPRNumberFromMergeGroup = (
  refName: string | undefined,
  logger: Logger,
): number | undefined => {
  if (!refName) {
    return undefined;
  }

  // GITHUB_REF_NAME format for merge_group: pr-<number>-<sha>
  // e.g., "pr-123-abc123"
  const withoutPrefix = refName.replace(/^pr-/, "");
  const dashIndex = withoutPrefix.indexOf("-");

  if (dashIndex === -1) {
    logger.warning(
      `GITHUB_REF_NAME is not a valid merge_group format: ${refName}`,
    );
    return undefined;
  }

  const prNumberStr = withoutPrefix.substring(0, dashIndex);
  const prNumber = parseInt(prNumberStr, 10);

  if (isNaN(prNumber)) {
    logger.warning(
      `Failed to parse PR number from GITHUB_REF_NAME: ${refName}`,
    );
    return undefined;
  }

  return prNumber;
};

export const getPRNumberFromSHA = async (
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  sha: string,
  logger: Logger,
): Promise<number | undefined> => {
  try {
    const { data } =
      await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
        owner,
        repo,
        commit_sha: sha,
      });

    if (data.length === 0) {
      return undefined;
    }

    return data[0].number;
  } catch (error) {
    logger.warning(`Failed to get PR from SHA: ${error}`);
    return undefined;
  }
};

export const getPRFiles = async (
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<PRFile[]> => {
  const maxPerPage = 100;
  const maxFiles = 3000;
  const files: PRFile[] = [];

  let page = 1;
  while (files.length < maxFiles) {
    const { data } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: maxPerPage,
      page,
    });

    if (data.length === 0) {
      break;
    }

    files.push(
      ...data.map((f) => ({
        filename: f.filename,
        previous_filename: f.previous_filename,
      })),
    );

    if (data.length < maxPerPage) {
      break;
    }

    page++;

    if (files.length >= maxFiles) {
      break;
    }
  }

  return files.slice(0, maxFiles);
};

const setValue = (
  key: string,
  value: string | number | boolean | undefined,
) => {
  core.setOutput(key, value);
  core.exportVariable(`CI_INFO_${key.toUpperCase()}`, value);
};

export interface PRData {
  body: string | null;
  base: {
    ref: string;
  };
  head: {
    ref: string;
    sha: string;
  };
  user: {
    login: string;
  };
  merged: boolean;
  labels?: Array<{
    name: string;
  }>;
}

export const writeOutputFiles = async (
  dir: string,
  prData: PRData,
  files: PRFile[],
) => {
  await fs.mkdir(dir, { recursive: true });

  // Write pr.json
  await fs.writeFile(
    path.join(dir, "pr.json"),
    JSON.stringify(prData, null, 2),
  );

  // Write pr_files.json
  await fs.writeFile(
    path.join(dir, "pr_files.json"),
    JSON.stringify(files, null, 2),
  );

  // Write pr_files.txt
  const filenames = files.map((f) => f.filename).join("\n");
  await fs.writeFile(path.join(dir, "pr_files.txt"), filenames);

  // Write pr_all_filenames.txt (including previous_filename for renames)
  const allFilenames = new Set<string>();
  files.forEach((f) => {
    allFilenames.add(f.filename);
    if (f.previous_filename) {
      allFilenames.add(f.previous_filename);
    }
  });
  await fs.writeFile(
    path.join(dir, "pr_all_filenames.txt"),
    Array.from(allFilenames).join("\n"),
  );

  // Write labels.txt
  const labels = (prData.labels || []).map((l) => l.name).join("\n");
  await fs.writeFile(path.join(dir, "labels.txt"), labels);
};

export type Result = {
  tempDir?: string;
  pr?: {
    data: PRData;
    /** Relative paths from the git root directory */
    files: string[];
  };
};

export type RunInput = {
  repoOwner?: string;
  repoName?: string;
  prNumber?: number;
  eventName?: string;
  refName?: string;
  sha?: string;
  octokit: ReturnType<typeof github.getOctokit>;
  tempDir?: string;
  logger?: Logger;
};

export const run = async (input: RunInput): Promise<Result> => {
  const repoOwner = input.repoOwner ?? github.context.repo.owner;
  const repoName = input.repoName ?? github.context.repo.repo;
  const eventName = input.eventName ?? github.context.eventName;
  const refName = input.refName ?? env.all.GITHUB_REF_NAME;
  const sha = input.sha ?? github.context.sha;
  const logger = input.logger ?? { info: core.info, warning: core.warning };

  setValue("repo_owner", repoOwner);
  setValue("repo_name", repoName);

  // Determine PR number
  let prNumber = input.prNumber;
  // Try to get PR number from merge_group event
  if (!prNumber && eventName === "merge_group") {
    logger.info("Attempting to get PR number from merge_group event");
    prNumber = getPRNumberFromMergeGroup(refName, logger);
  }
  setValue("is_pr", prNumber !== undefined);

  // Try to get PR number from SHA
  if (!prNumber) {
    prNumber = await getPRNumberFromSHA(
      input.octokit,
      repoOwner,
      repoName,
      sha,
      logger,
    );
  }
  setValue("has_associated_pr", prNumber !== undefined);

  if (!prNumber) {
    logger.info("No PR number found - running in non-PR environment");
    return {};
  }
  setValue("pr_number", prNumber);

  // Get PR details
  logger.info(`Fetching PR #${prNumber}`);
  const { data: prData } = await input.octokit.rest.pulls.get({
    owner: repoOwner,
    repo: repoName,
    pull_number: prNumber,
  });

  setValue("base_ref", prData.base.ref);
  setValue("head_ref", prData.head.ref);
  setValue("pr_author", prData.user.login);
  setValue("pr_merged", prData.merged);

  // Get PR files
  logger.info("Fetching PR files");
  const files = await getPRFiles(input.octokit, repoOwner, repoName, prNumber);
  logger.info(`Found ${files.length} files`);

  // Determine output directory
  const outputDir =
    input.tempDir ?? (await fs.mkdtemp(path.join(os.tmpdir(), "ci-info")));
  setValue("temp_dir", outputDir);
  // Write output files
  await writeOutputFiles(outputDir, prData, files);

  return {
    tempDir: outputDir,
    pr: {
      data: prData,
      files: files.map((f) => f.filename),
    },
  };
};

export const main = async (): Promise<Result> => {
  const octokit = github.getOctokit(input.getRequiredGitHubToken());
  return run({
    prNumber: github.context.payload.pull_request?.number,
    octokit,
  });
};
