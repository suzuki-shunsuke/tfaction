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

vi.mock("../get-target-config", () => ({
  getTargetConfig: vi.fn(),
}));

import * as core from "@actions/core";

import * as lib from "../../lib";
import * as aqua from "../../aqua";
import * as git from "../../lib/git";
import * as commit from "../../commit";
import * as getTargetConfig from "../get-target-config";

import {
  generateBranchName,
  writeSkipCreatePrSummary,
  run,
  type RunInput,
} from "./run";

describe("generateBranchName", () => {
  it("generates branch with scaffold-working-directory- prefix and timestamp format YYYYMMDDTHHMMSS", () => {
    const branch = generateBranchName("my/target");
    expect(branch).toMatch(
      /^scaffold-working-directory-my__target-\d{8}T\d{6}$/,
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
      "scaffold-working-directory-target-20240101T120000",
      "my/target",
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
      "my/target",
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
      "my/target",
      false,
      "https://github.com/owner/repo/actions/runs/123",
    );

    const summaryArg = vi.mocked(core.summary.addRaw).mock.calls[0][0];
    expect(summaryArg).not.toContain("-d ");
  });

  it("includes the runURL in the summary", () => {
    const runURL = "https://github.com/owner/repo/actions/runs/456";
    writeSkipCreatePrSummary(
      "owner/repo",
      "branch",
      "my/target",
      false,
      runURL,
    );

    const summaryArg = vi.mocked(core.summary.addRaw).mock.calls[0][0];
    expect(summaryArg).toContain(runURL);
  });
});

describe("run", () => {
  const defaultRunInput: RunInput = {
    githubToken: "test-token",
    securefixAppId: "",
    securefixAppPrivateKey: "",
    target: "my/target",
    workingDir: "my/working-dir",
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
    vi.mocked(getTargetConfig.getTargetConfig).mockResolvedValue({
      working_directory: "my/working-dir",
      target: "my/target",
    } as unknown as Awaited<
      ReturnType<typeof getTargetConfig.getTargetConfig>
    >);
    vi.mocked(aqua.NewExecutor).mockResolvedValue(
      {} as unknown as Awaited<ReturnType<typeof aqua.NewExecutor>>,
    );
    vi.mocked(git.getModifiedFiles).mockResolvedValue(["file1.tf"]);
    vi.mocked(commit.create).mockResolvedValue("");
  });

  it("throws when target is empty after getTargetConfig resolves", async () => {
    vi.mocked(getTargetConfig.getTargetConfig).mockResolvedValue({
      working_directory: "",
      target: "",
    } as unknown as Awaited<
      ReturnType<typeof getTargetConfig.getTargetConfig>
    >);

    await expect(
      run({
        ...defaultRunInput,
        target: "",
      }),
    ).rejects.toThrow("TFACTION_TARGET is required");
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
        branch: expect.stringContaining(
          "scaffold-working-directory-my__target-",
        ),
        pr: expect.objectContaining({
          title: "Scaffold a working directory (my/target)",
          body: expect.stringContaining("my/working-dir"),
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

  it("uses Handlebars templates from scaffold_working_directory config", async () => {
    vi.mocked(lib.getConfig).mockResolvedValue({
      skip_create_pr: false,
      draft_pr: false,
      securefix_action: {},
      scaffold_working_directory: {
        pull_request: {
          title: "Scaffold {{target}}",
          body: "Body for {{working_dir}} by {{actor}}",
          comment: "Comment {{run_url}}",
        },
      },
    } as unknown as Awaited<ReturnType<typeof lib.getConfig>>);

    await run(defaultRunInput);

    expect(commit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pr: expect.objectContaining({
          title: "Scaffold my/target",
          body: "Body for my/working-dir by user1",
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
          title: "Scaffold a working directory (my/target)",
          body: expect.stringContaining("my/working-dir"),
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
