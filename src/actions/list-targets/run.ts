// Business logic for list-targets action
// This file contains pure functions that can be tested without mocking

/**
 * Determines if ci-info should be skipped based on the event name.
 * ci-info is skipped for workflow_dispatch and schedule events.
 */
export const shouldSkipCiInfo = (eventName: string): boolean => {
  return eventName === "workflow_dispatch" || eventName === "schedule";
};

/**
 * Determines if the event is a pull request event.
 */
export const isPREvent = (eventName: string): boolean => {
  return eventName === "pull_request" || eventName.startsWith("pull_request_");
};

/**
 * Validates that the head SHA matches the latest head SHA.
 * Throws an error if they don't match.
 */
export const validateHeadSha = (
  headSha?: string,
  latestHeadSha?: string,
): void => {
  if (headSha && latestHeadSha && headSha !== latestHeadSha) {
    throw new Error(
      `The head sha (${headSha}) isn't latest (${latestHeadSha}).`,
    );
  }
};
