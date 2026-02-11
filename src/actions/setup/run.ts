// Helper functions extracted from index.ts for unit testing

// Check if the event is a pull request event
export const isPullRequestEvent = (eventName: string): boolean => {
  return eventName === "pull_request" || eventName.startsWith("pull_request_");
};

// Check if ci-info should be skipped
export const shouldSkipCIInfo = (eventName: string): boolean => {
  return eventName === "workflow_dispatch" || eventName === "schedule";
};

// Type for the pull request payload for testing purposes
// Uses index signature to be compatible with GitHub's WebhookPayload type
export type PullRequestPayload = {
  head?: {
    sha?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

// Check if the PR head SHA is the latest
// Throws an error if:
// - head SHA cannot be retrieved from payload
// - latest HEAD SHA is not provided
// - head SHA doesn't match latest HEAD SHA
export const checkLatestCommit = (
  payload: PullRequestPayload | undefined,
  latestHeadSHA: string,
): void => {
  const headSHA = payload?.head?.sha;
  if (!headSHA) {
    throw new Error("Failed to get the current SHA from event payload");
  }
  if (!latestHeadSHA) {
    throw new Error("Failed to get the pull request HEAD SHA");
  }

  if (headSHA !== latestHeadSHA) {
    throw new Error(
      `The head sha (${headSHA}) isn't latest (${latestHeadSHA}).`,
    );
  }
};
