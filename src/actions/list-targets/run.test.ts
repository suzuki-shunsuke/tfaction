import { describe, it, expect } from "vitest";
import { shouldSkipCiInfo, isPREvent, validateHeadSha } from "./run";

describe("shouldSkipCiInfo", () => {
  it("returns true for workflow_dispatch", () => {
    expect(shouldSkipCiInfo("workflow_dispatch")).toBe(true);
  });

  it("returns true for schedule", () => {
    expect(shouldSkipCiInfo("schedule")).toBe(true);
  });

  it("returns false for pull_request", () => {
    expect(shouldSkipCiInfo("pull_request")).toBe(false);
  });

  it("returns false for push", () => {
    expect(shouldSkipCiInfo("push")).toBe(false);
  });

  it("returns false for pull_request_target", () => {
    expect(shouldSkipCiInfo("pull_request_target")).toBe(false);
  });

  it("returns false for issue_comment", () => {
    expect(shouldSkipCiInfo("issue_comment")).toBe(false);
  });
});

describe("isPREvent", () => {
  it("returns true for pull_request", () => {
    expect(isPREvent("pull_request")).toBe(true);
  });

  it("returns true for pull_request_target", () => {
    expect(isPREvent("pull_request_target")).toBe(true);
  });

  it("returns true for pull_request_review", () => {
    expect(isPREvent("pull_request_review")).toBe(true);
  });

  it("returns true for pull_request_review_comment", () => {
    expect(isPREvent("pull_request_review_comment")).toBe(true);
  });

  it("returns false for push", () => {
    expect(isPREvent("push")).toBe(false);
  });

  it("returns false for workflow_dispatch", () => {
    expect(isPREvent("workflow_dispatch")).toBe(false);
  });

  it("returns false for schedule", () => {
    expect(isPREvent("schedule")).toBe(false);
  });

  it("returns false for issue_comment", () => {
    expect(isPREvent("issue_comment")).toBe(false);
  });
});

describe("validateHeadSha", () => {
  it("throws when head sha doesn't match latest", () => {
    expect(() => validateHeadSha("abc123", "def456")).toThrow(
      "The head sha (abc123) isn't latest (def456).",
    );
  });

  it("does not throw when head sha matches latest", () => {
    expect(() => validateHeadSha("abc123", "abc123")).not.toThrow();
  });

  it("does not throw when headSha is undefined", () => {
    expect(() => validateHeadSha(undefined, "def456")).not.toThrow();
  });

  it("does not throw when latestHeadSha is undefined", () => {
    expect(() => validateHeadSha("abc123", undefined)).not.toThrow();
  });

  it("does not throw when both are undefined", () => {
    expect(() => validateHeadSha(undefined, undefined)).not.toThrow();
  });

  it("does not throw when headSha is empty string", () => {
    expect(() => validateHeadSha("", "def456")).not.toThrow();
  });

  it("does not throw when latestHeadSha is empty string", () => {
    expect(() => validateHeadSha("abc123", "")).not.toThrow();
  });
});
