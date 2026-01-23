import * as github from "@actions/github";

export type Issue = {
  number: number;
  title: string;
  target: string;
  state: string;
  runs_on: string;
};

export type Logger = {
  info: (message: string) => void;
  debug: (message: string) => void;
  notice: (message: string) => void;
};

export type DriftDetectionConfig = {
  minimum_detection_interval: number;
  num_of_issues?: number;
};

export type RunInput = {
  driftDetection?: DriftDetectionConfig;
  octokit: ReturnType<typeof github.getOctokit>;
  targets: Map<string, string>; // target -> runs_on
  repoOwner: string;
  repoName: string;
  now: Date;
  serverUrl: string;
  logger: Logger;
};

export type RunResult = {
  hasIssues: boolean;
  issues: Issue[];
};

export const titlePattern = /^Terraform Drift \((\S+)\)$/;

// Calculate deadline (minimum_detection_interval hours ago)
export const getDeadline = (now: Date, durationHours: number): string => {
  if (durationHours === 0) {
    return "";
  }
  const deadline = new Date(now.getTime() - durationHours * 60 * 60 * 1000);
  return deadline.toISOString().replace(/\.\d{3}Z$/, "+00:00");
};

// List least recently updated drift issues using GraphQL
export const listLeastRecentlyUpdatedIssues = async (
  octokit: ReturnType<typeof github.getOctokit>,
  repoOwner: string,
  repoName: string,
  numOfIssues: number,
  deadline: string,
): Promise<Issue[]> => {
  const query = `
    query($searchQuery: String!, $cursor: String) {
      search(first: 100, after: $cursor, query: $searchQuery, type: ISSUE) {
        nodes {
          ... on Issue {
            number
            title
            state
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  `;

  let searchQuery = `repo:${repoOwner}/${repoName} "Terraform Drift" in:title sort:updated-asc`;
  if (deadline) {
    searchQuery += ` updated:<${deadline}`;
  }
  const issues: Issue[] = [];
  let cursor: string | null = null;

  while (true) {
    const result: {
      search: {
        nodes: Array<{
          number: number;
          title: string;
          state: string;
        }>;
        pageInfo: {
          endCursor: string;
          hasNextPage: boolean;
        };
      };
    } = await octokit.graphql(query, {
      searchQuery,
      cursor,
    });

    for (const node of result.search.nodes) {
      const match = titlePattern.exec(node.title);
      if (!match) {
        continue;
      }
      issues.push({
        number: node.number,
        title: node.title,
        target: match[1],
        state: node.state.toLowerCase(),
        runs_on: "",
      });
      if (issues.length >= numOfIssues) {
        return issues;
      }
    }

    if (!result.search.pageInfo.hasNextPage) {
      break;
    }
    cursor = result.search.pageInfo.endCursor;
  }

  return issues;
};

// Archive issue (close & rename)
export const archiveIssue = async (
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  issueNumber: number,
  title: string,
  logger: Logger,
): Promise<void> => {
  await octokit.rest.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    state: "closed",
    title,
  });
  logger.info(`Archived issue #${issueNumber}`);
};

// Testable run function that takes dependencies as input
export const run = async (input: RunInput): Promise<RunResult> => {
  const {
    driftDetection,
    octokit,
    targets,
    repoOwner,
    repoName,
    now,
    serverUrl,
    logger,
  } = input;

  // If drift_detection is not configured, return empty
  if (!driftDetection) {
    return { hasIssues: false, issues: [] };
  }

  // Calculate deadline
  const deadline = getDeadline(now, driftDetection.minimum_detection_interval);
  if (deadline) {
    logger.info(`Deadline: ${deadline}`);
  } else {
    logger.info(`No Deadline`);
  }

  // List least recently updated drift issues
  const issues = await listLeastRecentlyUpdatedIssues(
    octokit,
    repoOwner,
    repoName,
    driftDetection.num_of_issues ?? 1,
    deadline,
  );
  logger.debug(`Found ${issues.length} drift issues`);

  // Filter issues and archive orphaned ones
  const result: Issue[] = [];
  for (const issue of issues) {
    const runsOn = targets.get(issue.target);
    if (runsOn !== undefined) {
      result.push({ ...issue, runs_on: runsOn });
    } else {
      // If there is no target associated with the issue, archive the issue.
      logger.notice(
        `Target ${issue.target} not found, archiving issue ${serverUrl}/${repoOwner}/${repoName}/issues/${issue.number}`,
      );
      await archiveIssue(
        octokit,
        repoOwner,
        repoName,
        issue.number,
        "Archived " + issue.title,
        logger,
      );
    }
  }

  return { hasIssues: result.length > 0, issues: result };
};
