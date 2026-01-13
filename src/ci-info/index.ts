import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

interface PRFile {
  filename: string;
  previous_filename?: string;
}

const getPRNumberFromMergeGroup = (): number | undefined => {
  const refName = process.env.GITHUB_REF_NAME;
  if (!refName) {
    return undefined;
  }

  // GITHUB_REF_NAME format for merge_group: pr-<number>-<sha>
  // e.g., "pr-123-abc123"
  const withoutPrefix = refName.replace(/^pr-/, "");
  const dashIndex = withoutPrefix.indexOf("-");

  if (dashIndex === -1) {
    core.warning(
      `GITHUB_REF_NAME is not a valid merge_group format: ${refName}`,
    );
    return undefined;
  }

  const prNumberStr = withoutPrefix.substring(0, dashIndex);
  const prNumber = parseInt(prNumberStr, 10);

  if (isNaN(prNumber)) {
    core.warning(`Failed to parse PR number from GITHUB_REF_NAME: ${refName}`);
    return undefined;
  }

  return prNumber;
};

const getPRNumberFromSHA = async (
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  sha: string,
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
    core.warning(`Failed to get PR from SHA: ${error}`);
    return undefined;
  }
};

const getPRFiles = async (
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

interface PRData {
  labels?: Array<{ name: string }>;
}

const writeOutputFiles = async (
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

export const main = async () => {
  setValue("repo_owner", github.context.repo.owner);
  setValue("repo_name", github.context.repo.repo);

  // Determine PR number
  let prNumber = github.context.payload.pull_request?.number;
  // Try to get PR number from merge_group event
  if (!prNumber && github.context.eventName === "merge_group") {
    core.info("Attempting to get PR number from merge_group event");
    prNumber = getPRNumberFromMergeGroup();
  }
  setValue("is_pr", prNumber !== undefined);

  const octokit = github.getOctokit(
    core.getInput("github_token", {
      required: true,
    }),
  );

  // Try to get PR number from SHA
  if (!prNumber) {
    prNumber = await getPRNumberFromSHA(
      octokit,
      github.context.repo.owner,
      github.context.repo.repo,
      github.context.sha,
    );
  }
  setValue("has_associated_pr", prNumber !== undefined);

  if (!prNumber) {
    core.info("No PR number found - running in non-PR environment");
    return;
  }
  setValue("pr_number", prNumber);

  // Get PR details
  core.info(`Fetching PR #${prNumber}`);
  const { data: prData } = await octokit.rest.pulls.get({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber,
  });

  setValue("base_ref", prData.base.ref);
  setValue("head_ref", prData.head.ref);
  setValue("pr_author", prData.user.login);
  setValue("pr_merged", prData.merged);

  // Get PR files
  core.info("Fetching PR files");
  const files = await getPRFiles(
    octokit,
    github.context.repo.owner,
    github.context.repo.repo,
    prNumber,
  );
  core.info(`Found ${files.length} files`);

  // Determine output directory
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "ci-info"));
  setValue("temp_dir", outputDir);
  // Write output files
  await writeOutputFiles(outputDir, prData, files);
  core.info(`Output files written to: ${outputDir}`);

  core.info("CI info collection completed successfully");
};
