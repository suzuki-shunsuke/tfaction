import { describe, it, expect } from "vitest";
import {
  isPullRequestEvent,
  shouldSkipCIInfo,
  checkLatestCommit,
  type PullRequestPayload,
} from "./run";

describe("isPullRequestEvent", () => {
  it('returns true for "pull_request" event', () => {
    expect(isPullRequestEvent("pull_request")).toBe(true);
  });

  it('returns true for "pull_request_target" event', () => {
    expect(isPullRequestEvent("pull_request_target")).toBe(true);
  });

  it('returns true for "pull_request_review" event', () => {
    expect(isPullRequestEvent("pull_request_review")).toBe(true);
  });

  it('returns true for "pull_request_review_comment" event', () => {
    expect(isPullRequestEvent("pull_request_review_comment")).toBe(true);
  });

  it('returns false for "push" event', () => {
    expect(isPullRequestEvent("push")).toBe(false);
  });

  it('returns false for "workflow_dispatch" event', () => {
    expect(isPullRequestEvent("workflow_dispatch")).toBe(false);
  });

  it('returns false for "schedule" event', () => {
    expect(isPullRequestEvent("schedule")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isPullRequestEvent("")).toBe(false);
  });

  it('returns false for "issues" event', () => {
    expect(isPullRequestEvent("issues")).toBe(false);
  });
});

describe("shouldSkipCIInfo", () => {
  it('returns true for "workflow_dispatch" event', () => {
    expect(shouldSkipCIInfo("workflow_dispatch")).toBe(true);
  });

  it('returns true for "schedule" event', () => {
    expect(shouldSkipCIInfo("schedule")).toBe(true);
  });

  it('returns false for "pull_request" event', () => {
    expect(shouldSkipCIInfo("pull_request")).toBe(false);
  });

  it('returns false for "push" event', () => {
    expect(shouldSkipCIInfo("push")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(shouldSkipCIInfo("")).toBe(false);
  });

  it('returns false for "issues" event', () => {
    expect(shouldSkipCIInfo("issues")).toBe(false);
  });
});

describe("checkLatestCommit", () => {
  it("does not throw when SHAs match", () => {
    const payload: PullRequestPayload = {
      head: {
        sha: "abc123",
      },
    };
    expect(() => checkLatestCommit(payload, "abc123")).not.toThrow();
  });

  it("throws when payload is undefined", () => {
    expect(() => checkLatestCommit(undefined, "abc123")).toThrow(
      "Failed to get the current SHA from event payload",
    );
  });

  it("throws when payload.head is undefined", () => {
    const payload: PullRequestPayload = {};
    expect(() => checkLatestCommit(payload, "abc123")).toThrow(
      "Failed to get the current SHA from event payload",
    );
  });

  it("throws when payload.head.sha is undefined", () => {
    const payload: PullRequestPayload = {
      head: {},
    };
    expect(() => checkLatestCommit(payload, "abc123")).toThrow(
      "Failed to get the current SHA from event payload",
    );
  });

  it("throws when latestHeadSHA is empty string", () => {
    const payload: PullRequestPayload = {
      head: {
        sha: "abc123",
      },
    };
    expect(() => checkLatestCommit(payload, "")).toThrow(
      "Failed to get the pull request HEAD SHA",
    );
  });

  it("throws when SHAs do not match", () => {
    const payload: PullRequestPayload = {
      head: {
        sha: "abc123",
      },
    };
    expect(() => checkLatestCommit(payload, "def456")).toThrow(
      "The head sha (abc123) isn't latest (def456).",
    );
  });

  it("includes both SHAs in error message when they do not match", () => {
    const payload: PullRequestPayload = {
      head: {
        sha: "oldsha123",
      },
    };
    try {
      checkLatestCommit(payload, "newsha456");
      expect.fail("Expected an error to be thrown");
    } catch (error) {
      expect((error as Error).message).toContain("oldsha123");
      expect((error as Error).message).toContain("newsha456");
    }
  });
});
