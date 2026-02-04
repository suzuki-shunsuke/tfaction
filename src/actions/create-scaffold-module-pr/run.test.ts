import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@actions/core", () => ({
  info: vi.fn(),
  summary: {
    addRaw: vi.fn(),
    write: vi.fn(),
  },
}));

vi.mock("../../lib", () => ({
  getConfig: vi.fn(),
}));

vi.mock("../../aqua", () => ({
  NewExecutor: vi.fn(),
}));

vi.mock("../../lib/git", () => ({
  getModifiedFiles: vi.fn(),
}));

vi.mock("../../commit", () => ({
  create: vi.fn(),
}));

import * as core from "@actions/core";

import * as lib from "../../lib";
import * as aqua from "../../aqua";
import * as git from "../../lib/git";
import * as commit from "../../commit";

import {
  generateBranchName,
  writeSkipCreatePrSummary,
  run,
  type RunInput,
} from "./run";

describe("generateBranchName", () => {
  it("generates branch with scaffold-module- prefix and timestamp format YYYYMMDDTHHMMSS", () => {
    const branch = generateBranchName("my/module");
    expect(branch).toMatch(
      /^scaffold-module-my__module-\d{8}T\d{6}$/,
    );
  });

  it("replaces slashes with __", () => {
    const branch = generateBranchName("a/b/c");
    expect(branch).toContain("a__b__c");
    expect(branch).not.toContain("/");
  });
});

describe("writeSkipCreatePrSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes summary containing gh pr create command", () => {
    writeSkipCreatePrSummary(
      "owner/repo",
      "scaffold-module-mod-20240101T120000",
      "my/module",
      false,
      "https://github.com/owner/repo/actions/runs/123",
    );

    expect(core.summary.addRaw).toHaveBeenCalledWith(
      expect.stringContaining("gh pr create"),
    );
    expect(core.summary.write).toHaveBeenCalled();
  });

  it("includes -d flag when draftPr is true", () => {
    writeSkipCreatePrSummary(
      "owner/repo",
      "branch",
      "my/module",
      true,
      "https://github.com/owner/repo/actions/runs/123",
    );

    const summaryArg = vi.mocked(core.summary.addRaw).mock.calls[0][0];
    expect(summaryArg).toContain("-d ");
  });

  it("omits -d flag when draftPr is false", () => {
    writeSkipCreatePrSummary(
      "owner/repo",
      "branch",
      "my/module",
      false,
      "https://github.com/owner/repo/actions/runs/123",
    );

    const summaryArg = vi.mocked(core.summary.addRaw).mock.calls[0][0];
    expect(summaryArg).not.toContain("-d ");
  });

  it("includes the runURL in the summary", () => {
    const runURL = "https://github.com/owner/repo/actions/runs/456";
    writeSkipCreatePrSummary("owner/repo", "branch", "my/module", false, runURL);

    const summaryArg = vi.mocked(core.summary.addRaw).mock.calls[0][0];
    expect(summaryArg).toContain(runURL);
  });
});

describe("run", () => {
  const defaultRunInput: RunInput = {
    githubToken: "test-token",
    securefixAppId: "",
    securefixAppPrivateKey: "",
    modulePath: "my/module",
    actor: "user1",
    repository: "owner/repo",
    runURL: "https://github.com/owner/repo/actions/runs/123",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(lib.getConfig).mockResolvedValue({
      skip_create_pr: false,
      draft_pr: false,
      securefix_action: {},
    } as unknown as Awaited<ReturnType<typeof lib.getConfig>>);
    vi.mocked(aqua.NewExecutor).mockResolvedValue(
      {} as unknown as Awaited<ReturnType<typeof aqua.NewExecutor>>,
    );
    vi.mocked(git.getModifiedFiles).mockResolvedValue(["file1.tf"]);
    vi.mocked(commit.create).mockResolvedValue("");
  });

  it("throws when neither githubToken nor securefix credentials provided", async () => {
    await expect(
      run({
        ...defaultRunInput,
        githubToken: "",
        securefixAppId: "",
        securefixAppPrivateKey: "",
      }),
    ).rejects.toThrow(
      "github_token or a pair of securefix_action_app_id and securefix_action_app_private_key is required",
    );
  });

  it("throws when modulePath is empty", async () => {
    await expect(
      run({
        ...defaultRunInput,
        modulePath: "",
      }),
    ).rejects.toThrow("env.TFACTION_MODULE_PATH is required");
  });

  it("returns early when no modified files found", async () => {
    vi.mocked(git.getModifiedFiles).mockResolvedValue([]);

    await run(defaultRunInput);

    expect(core.info).toHaveBeenCalledWith("No files to commit");
    expect(commit.create).not.toHaveBeenCalled();
  });

  it("creates commit and PR (happy path, skip_create_pr=false)", async () => {
    await run(defaultRunInput);

    expect(commit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        githubToken: "test-token",
        branch: expect.stringContaining("scaffold-module-my__module-"),
        pr: expect.objectContaining({
          title: "Scaffold a Terraform Module (my/module)",
          body: expect.stringContaining("GitHub Actions"),
          assignees: ["user1"],
        }),
      }),
    );
  });

  it("passes pr: undefined to commit.create when skip_create_pr=true", async () => {
    vi.mocked(lib.getConfig).mockResolvedValue({
      skip_create_pr: true,
      draft_pr: false,
      securefix_action: {},
    } as unknown as Awaited<ReturnType<typeof lib.getConfig>>);

    await run(defaultRunInput);

    expect(commit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pr: undefined,
      }),
    );
  });

  it("calls writeSkipCreatePrSummary when skip_create_pr=true", async () => {
    vi.mocked(lib.getConfig).mockResolvedValue({
      skip_create_pr: true,
      draft_pr: false,
      securefix_action: {},
    } as unknown as Awaited<ReturnType<typeof lib.getConfig>>);

    await run(defaultRunInput);

    expect(core.summary.addRaw).toHaveBeenCalledWith(
      expect.stringContaining("gh pr create"),
    );
    expect(core.summary.write).toHaveBeenCalled();
  });

  it("uses Handlebars templates when configured in config", async () => {
    vi.mocked(lib.getConfig).mockResolvedValue({
      skip_create_pr: false,
      draft_pr: false,
      securefix_action: {},
      scaffold_module: {
        pull_request: {
          title: "Scaffold {{module_path}}",
          body: "Body for {{module_path}} by {{actor}}",
          comment: "Comment {{run_url}}",
        },
      },
    } as unknown as Awaited<ReturnType<typeof lib.getConfig>>);

    await run(defaultRunInput);

    expect(commit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pr: expect.objectContaining({
          title: "Scaffold my/module",
          body: "Body for my/module by user1",
          comment: expect.stringContaining(defaultRunInput.runURL),
        }),
      }),
    );
  });

  it("uses default title/body/comment when no template configured", async () => {
    await run(defaultRunInput);

    expect(commit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pr: expect.objectContaining({
          title: "Scaffold a Terraform Module (my/module)",
          body: `This pull request was created by [GitHub Actions](${defaultRunInput.runURL})`,
          comment: expect.stringContaining("@user1"),
        }),
      }),
    );
  });

  it("sets assignees to [actor] when actor is provided", async () => {
    await run(defaultRunInput);

    expect(commit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pr: expect.objectContaining({
          assignees: ["user1"],
        }),
      }),
    );
  });

  it("sets assignees to undefined when actor is empty", async () => {
    await run({
      ...defaultRunInput,
      actor: "",
    });

    expect(commit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pr: expect.objectContaining({
          assignees: undefined,
        }),
      }),
    );
  });
});
