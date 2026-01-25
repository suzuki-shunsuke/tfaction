import { describe, it, expect } from "vitest";
import { run, type RunInput } from "./run";

describe("run", () => {
  it("builds all environment variables correctly", () => {
    const input: RunInput = {
      issue: {
        number: 123,
        state: "open",
        target: "aws/foo/dev",
      },
      repoOwner: "suzuki-shunsuke",
      repoName: "tfaction",
      serverUrl: "https://github.com",
    };

    const result = run(input);

    // Check TFCMT environment variables
    expect(result.envVars.TFCMT_REPO_OWNER).toBe("suzuki-shunsuke");
    expect(result.envVars.TFCMT_REPO_NAME).toBe("tfaction");
    expect(result.envVars.TFCMT_PR_NUMBER).toBe(123);

    // Check GH_COMMENT environment variables
    expect(result.envVars.GH_COMMENT_REPO_OWNER).toBe("suzuki-shunsuke");
    expect(result.envVars.GH_COMMENT_REPO_NAME).toBe("tfaction");
    expect(result.envVars.GH_COMMENT_PR_NUMBER).toBe(123);

    // Check TFACTION_DRIFT_ISSUE environment variables
    expect(result.envVars.TFACTION_DRIFT_ISSUE_REPO_OWNER).toBe(
      "suzuki-shunsuke",
    );
    expect(result.envVars.TFACTION_DRIFT_ISSUE_REPO_NAME).toBe("tfaction");
    expect(result.envVars.TFACTION_DRIFT_ISSUE_REPO_FULLNAME).toBe(
      "suzuki-shunsuke/tfaction",
    );
    expect(result.envVars.TFACTION_DRIFT_ISSUE_NUMBER).toBe(123);
    expect(result.envVars.TFACTION_DRIFT_ISSUE_STATE).toBe("open");
    expect(result.envVars.TFACTION_DRIFT_ISSUE_URL).toBe(
      "https://github.com/suzuki-shunsuke/tfaction/issues/123",
    );

    // Check TFACTION environment variables
    expect(result.envVars.TFACTION_JOB_TYPE).toBe("terraform");
    expect(result.envVars.TFACTION_TARGET).toBe("aws/foo/dev");
  });

  it("generates correct issue URL", () => {
    const input: RunInput = {
      issue: {
        number: 456,
        state: "closed",
        target: "gcp/bar/prod",
      },
      repoOwner: "owner",
      repoName: "repo",
      serverUrl: "https://github.com",
    };

    const result = run(input);

    expect(result.issueUrl).toBe("https://github.com/owner/repo/issues/456");
  });

  it("handles issue with open state", () => {
    const input: RunInput = {
      issue: {
        number: 1,
        state: "open",
        target: "test/target",
      },
      repoOwner: "org",
      repoName: "project",
      serverUrl: "https://github.com",
    };

    const result = run(input);

    expect(result.envVars.TFACTION_DRIFT_ISSUE_STATE).toBe("open");
  });

  it("handles issue with closed state", () => {
    const input: RunInput = {
      issue: {
        number: 999,
        state: "closed",
        target: "prod/service",
      },
      repoOwner: "company",
      repoName: "infra",
      serverUrl: "https://github.com",
    };

    const result = run(input);

    expect(result.envVars.TFACTION_DRIFT_ISSUE_STATE).toBe("closed");
  });

  it("handles GitHub Enterprise Server URL", () => {
    const input: RunInput = {
      issue: {
        number: 42,
        state: "open",
        target: "aws/eks/staging",
      },
      repoOwner: "enterprise-org",
      repoName: "terraform-infra",
      serverUrl: "https://github.enterprise.com",
    };

    const result = run(input);

    expect(result.issueUrl).toBe(
      "https://github.enterprise.com/enterprise-org/terraform-infra/issues/42",
    );
    expect(result.envVars.TFACTION_DRIFT_ISSUE_URL).toBe(
      "https://github.enterprise.com/enterprise-org/terraform-infra/issues/42",
    );
  });

  it("handles target with complex path", () => {
    const input: RunInput = {
      issue: {
        number: 100,
        state: "open",
        target: "aws/us-east-1/production/vpc-main",
      },
      repoOwner: "acme",
      repoName: "cloud-infra",
      serverUrl: "https://github.com",
    };

    const result = run(input);

    expect(result.envVars.TFACTION_TARGET).toBe(
      "aws/us-east-1/production/vpc-main",
    );
  });

  it("always sets TFACTION_JOB_TYPE to terraform", () => {
    const input: RunInput = {
      issue: {
        number: 1,
        state: "open",
        target: "any/target",
      },
      repoOwner: "owner",
      repoName: "repo",
      serverUrl: "https://github.com",
    };

    const result = run(input);

    expect(result.envVars.TFACTION_JOB_TYPE).toBe("terraform");
  });

  it("returns issueUrl matching TFACTION_DRIFT_ISSUE_URL", () => {
    const input: RunInput = {
      issue: {
        number: 789,
        state: "open",
        target: "target",
      },
      repoOwner: "test-owner",
      repoName: "test-repo",
      serverUrl: "https://github.com",
    };

    const result = run(input);

    expect(result.issueUrl).toBe(result.envVars.TFACTION_DRIFT_ISSUE_URL);
  });

  it("handles numeric owner and repo names", () => {
    const input: RunInput = {
      issue: {
        number: 1,
        state: "open",
        target: "path/to/target",
      },
      repoOwner: "owner123",
      repoName: "repo456",
      serverUrl: "https://github.com",
    };

    const result = run(input);

    expect(result.envVars.TFACTION_DRIFT_ISSUE_REPO_FULLNAME).toBe(
      "owner123/repo456",
    );
    expect(result.issueUrl).toBe(
      "https://github.com/owner123/repo456/issues/1",
    );
  });
});
