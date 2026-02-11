import { describe, it, expect, vi, beforeEach } from "vitest";
import { run, type RunInput, type Octokit } from "./run";

const createMockOctokit = () => ({
  graphql: vi.fn(),
  rest: {
    issues: {
      createComment: vi.fn(),
      update: vi.fn(),
    },
  },
});

const createMockLogger = () => ({
  info: vi.fn(),
});

const createRunInput = (
  overrides: Partial<RunInput> = {},
): RunInput & { octokit: ReturnType<typeof createMockOctokit> } => {
  const octokit = createMockOctokit();
  return {
    status: "success",
    issueNumber: 42,
    issueState: "open",
    repoOwner: "owner",
    repoName: "repo",
    skipTerraform: false,
    runURL: "https://github.com/owner/repo/actions/runs/123",
    octokit: octokit as unknown as Octokit,
    logger: createMockLogger(),
    ...overrides,
    // Ensure octokit from overrides is used if provided, otherwise use the created one
  } as RunInput & { octokit: ReturnType<typeof createMockOctokit> };
};

describe("run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("early exit when issueNumber is undefined", async () => {
    const input = createRunInput({ issueNumber: undefined });
    await run(input);
    expect(input.octokit.graphql).not.toHaveBeenCalled();
    expect(input.octokit.rest.issues.createComment).not.toHaveBeenCalled();
    expect(input.octokit.rest.issues.update).not.toHaveBeenCalled();
  });

  it("posts comment when status is not success", async () => {
    const input = createRunInput({
      status: "failure",
      issueState: "open",
    });
    input.octokit.graphql.mockResolvedValue({
      repository: {
        issue: {
          comments: {
            nodes: [{ body: "some other comment" }],
          },
        },
      },
    });

    await run(input);

    expect(input.octokit.graphql).toHaveBeenCalled();
    expect(input.octokit.rest.issues.createComment).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 42,
      body: expect.stringContaining("CI failed"),
    });
  });

  it("skips comment when latest comment already contains runURL", async () => {
    const runURL = "https://github.com/owner/repo/actions/runs/123";
    const input = createRunInput({
      status: "failure",
      issueState: "open",
      runURL,
    });
    input.octokit.graphql.mockResolvedValue({
      repository: {
        issue: {
          comments: {
            nodes: [
              {
                body: `## :x: CI failed\n\n[Build link](${runURL})\n`,
              },
            ],
          },
        },
      },
    });

    await run(input);

    expect(input.octokit.graphql).toHaveBeenCalled();
    expect(input.octokit.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it("posts comment with correct body format", async () => {
    const runURL = "https://github.com/owner/repo/actions/runs/456";
    const input = createRunInput({
      status: "failure",
      issueState: "open",
      runURL,
    });
    input.octokit.graphql.mockResolvedValue({
      repository: {
        issue: {
          comments: {
            nodes: [],
          },
        },
      },
    });

    await run(input);

    expect(input.octokit.rest.issues.createComment).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 42,
      body: `## :x: CI failed\n\n[Build link](${runURL})\n`,
    });
  });

  it("closes issue when state=open, status=success, skipTerraform=false", async () => {
    const input = createRunInput({
      status: "success",
      issueState: "open",
      skipTerraform: false,
    });

    await run(input);

    expect(input.octokit.rest.issues.update).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 42,
      state: "closed",
    });
  });

  it("does not close issue when skipTerraform=true", async () => {
    const input = createRunInput({
      status: "success",
      issueState: "open",
      skipTerraform: true,
    });

    await run(input);

    expect(input.octokit.rest.issues.update).not.toHaveBeenCalled();
  });

  it("does not close issue when status is not success", async () => {
    const input = createRunInput({
      status: "failure",
      issueState: "open",
    });
    input.octokit.graphql.mockResolvedValue({
      repository: {
        issue: {
          comments: {
            nodes: [],
          },
        },
      },
    });

    await run(input);

    // update should not be called with "closed"
    const updateCalls = input.octokit.rest.issues.update.mock.calls;
    for (const call of updateCalls) {
      expect(call[0].state).not.toBe("closed");
    }
  });

  it("does not close issue when state is not open", async () => {
    const input = createRunInput({
      status: "success",
      issueState: "closed",
    });

    await run(input);

    // update should not be called with "closed"
    const updateCalls = input.octokit.rest.issues.update.mock.calls;
    for (const call of updateCalls) {
      expect(call[0].state).not.toBe("closed");
    }
  });

  it("reopens issue when state=closed and status is not success", async () => {
    const input = createRunInput({
      status: "failure",
      issueState: "closed",
    });
    input.octokit.graphql.mockResolvedValue({
      repository: {
        issue: {
          comments: {
            nodes: [],
          },
        },
      },
    });

    await run(input);

    expect(input.octokit.rest.issues.update).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 42,
      state: "open",
    });
  });

  it("does not reopen issue when state is not closed", async () => {
    const input = createRunInput({
      status: "failure",
      issueState: "open",
    });
    input.octokit.graphql.mockResolvedValue({
      repository: {
        issue: {
          comments: {
            nodes: [],
          },
        },
      },
    });

    await run(input);

    // update should not be called with "open"
    const updateCalls = input.octokit.rest.issues.update.mock.calls;
    for (const call of updateCalls) {
      expect(call[0].state).not.toBe("open");
    }
  });

  it("does not reopen issue when status is success", async () => {
    const input = createRunInput({
      status: "success",
      issueState: "closed",
    });

    await run(input);

    // update should not be called with "open"
    const updateCalls = input.octokit.rest.issues.update.mock.calls;
    for (const call of updateCalls) {
      expect(call[0].state).not.toBe("open");
    }
  });

  it("both comment and reopen happen when state=closed and status=failure", async () => {
    const input = createRunInput({
      status: "failure",
      issueState: "closed",
    });
    input.octokit.graphql.mockResolvedValue({
      repository: {
        issue: {
          comments: {
            nodes: [],
          },
        },
      },
    });

    await run(input);

    expect(input.octokit.rest.issues.createComment).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "owner",
        repo: "repo",
        issue_number: 42,
      }),
    );
    expect(input.octokit.rest.issues.update).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 42,
      state: "open",
    });
  });
});
