import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@actions/core", () => ({
  info: vi.fn(),
}));

vi.mock("@actions/github", () => ({
  getOctokit: vi.fn(),
  context: {
    repo: {
      owner: "test-owner",
      repo: "test-repo",
    },
  },
}));

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  return {
    ...actual,
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    appendFileSync: vi.fn(),
  };
});

vi.mock("../../lib", () => ({
  getConfig: vi.fn(),
  GitHubActionPath: "/action-path",
}));

vi.mock("../../aqua", () => ({
  NewExecutor: vi.fn(),
}));

vi.mock("../../lib/git", () => ({
  getModifiedFiles: vi.fn(),
  getCurrentBranch: vi.fn(),
}));

vi.mock("../../commit", () => ({
  create: vi.fn(),
}));

vi.mock("../get-target-config", () => ({
  getTargetConfig: vi.fn(),
}));

import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";

import * as lib from "../../lib";
import * as aqua from "../../aqua";
import * as git from "../../lib/git";
import * as commit from "../../commit";
import * as getTargetConfig from "../get-target-config";

import {
  generateBranchName,
  createTfmigrateHcl,
  createMigrationFile,
  outputSkipCreatePrGuide,
  createLabel,
  addLabelToPR,
  run,
  type RunInput,
} from "./run";

const createMockOctokit = () => ({
  rest: {
    issues: {
      addLabels: vi.fn().mockResolvedValue({}),
      createLabel: vi.fn().mockResolvedValue({}),
    },
  },
});

const createMockExecutor = () => ({
  exec: vi.fn().mockResolvedValue(0),
});

const defaultRunInput: RunInput = {
  githubToken: "test-token",
  migrationName: "main",
  prNumber: "",
  securefixAppId: "",
  securefixAppPrivateKey: "",
  target: "aws/dev",
  workingDir: "aws/dev",
  actor: "user1",
  repository: "owner/repo",
  runURL: "https://github.com/owner/repo/actions/runs/123",
  stepSummaryPath: "/tmp/step-summary",
};

describe("generateBranchName", () => {
  it("returns empty string when prNumber is provided", () => {
    expect(generateBranchName("aws/dev", "42")).toBe("");
  });

  it("generates branch with scaffold-tfmigrate- prefix and timestamp when no prNumber", () => {
    const branch = generateBranchName("aws/dev", "");
    expect(branch).toMatch(/^scaffold-tfmigrate-aws__dev-\d{8}T\d{6}$/);
  });

  it("replaces slashes with __ in branch name", () => {
    const branch = generateBranchName("a/b/c", "");
    expect(branch).toContain("a__b__c");
    expect(branch).not.toContain("/");
  });
});

describe("createTfmigrateHcl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips if .tfmigrate.hcl already exists", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);

    createTfmigrateHcl("/work", "target", "s3-bucket", undefined, "/action");

    expect(core.info).toHaveBeenCalledWith(
      ".tfmigrate.hcl already exists, skipping",
    );
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it("creates .tfmigrate.hcl with S3 backend when s3Bucket is provided", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockReturnValue(
      "bucket = {{s3_bucket_name_for_tfmigrate_history}}",
    );

    createTfmigrateHcl(
      "/work",
      "my/target",
      "my-s3-bucket",
      undefined,
      "/action",
    );

    expect(fs.readFileSync).toHaveBeenCalledWith(
      "/action/install/tfmigrate.hcl",
      "utf8",
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/work/.tfmigrate.hcl",
      "bucket = my-s3-bucket",
    );
    expect(core.info).toHaveBeenCalledWith(
      "Created .tfmigrate.hcl with S3 backend",
    );
  });

  it("creates .tfmigrate.hcl with GCS backend when gcsBucket is provided", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockReturnValue(
      "bucket = {{gcs_bucket_name_for_tfmigrate_history}}",
    );

    createTfmigrateHcl(
      "/work",
      "my/target",
      undefined,
      "my-gcs-bucket",
      "/action",
    );

    expect(fs.readFileSync).toHaveBeenCalledWith(
      "/action/install/tfmigrate-gcs.hcl",
      "utf8",
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/work/.tfmigrate.hcl",
      "bucket = my-gcs-bucket",
    );
    expect(core.info).toHaveBeenCalledWith(
      "Created .tfmigrate.hcl with GCS backend",
    );
  });

  it("does nothing when neither s3Bucket nor gcsBucket is provided", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    createTfmigrateHcl("/work", "target", undefined, undefined, "/action");

    expect(fs.readFileSync).not.toHaveBeenCalled();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });
});

describe("createMigrationFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates tfmigrate/ directory if it does not exist", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockReturnValue("migration {{migration_name}}");

    createMigrationFile("/work", "main", "/action");

    expect(fs.mkdirSync).toHaveBeenCalledWith("/work/tfmigrate", {
      recursive: true,
    });
  });

  it("does not create tfmigrate/ directory if it already exists", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue("migration {{migration_name}}");

    createMigrationFile("/work", "main", "/action");

    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });

  it("creates timestamped migration file with rendered template content", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue("migration {{migration_name}}");

    createMigrationFile("/work", "main", "/action");

    expect(fs.readFileSync).toHaveBeenCalledWith(
      "/action/install/migration.hcl",
      "utf8",
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/\/work\/tfmigrate\/\d{14}_main\.hcl$/),
      "migration main",
    );
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining("Created migration file:"),
    );
  });
});

describe("outputSkipCreatePrGuide", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("appends guide text to step summary file", () => {
    outputSkipCreatePrGuide(
      "tfmigrate:target",
      "branch-name",
      "my/target",
      false,
      "owner/repo",
      "https://github.com/owner/repo/actions/runs/123",
      "/tmp/summary",
    );

    expect(fs.appendFileSync).toHaveBeenCalledWith(
      "/tmp/summary",
      expect.stringContaining("gh pr create"),
    );
    expect(core.info).toHaveBeenCalledWith(
      "Output skip-create-pr guide to GitHub Step Summary",
    );
  });

  it("includes -d flag when draftPr is true", () => {
    outputSkipCreatePrGuide(
      "tfmigrate:target",
      "branch",
      "my/target",
      true,
      "owner/repo",
      "https://github.com/runs/1",
      "/tmp/summary",
    );

    const appendArg = vi.mocked(fs.appendFileSync).mock.calls[0][1] as string;
    expect(appendArg).toContain("-d ");
  });

  it("omits -d flag when draftPr is false", () => {
    outputSkipCreatePrGuide(
      "tfmigrate:target",
      "branch",
      "my/target",
      false,
      "owner/repo",
      "https://github.com/runs/1",
      "/tmp/summary",
    );

    const appendArg = vi.mocked(fs.appendFileSync).mock.calls[0][1] as string;
    expect(appendArg).not.toContain("-d ");
  });
});

describe("createLabel", () => {
  let mockOctokit: ReturnType<typeof createMockOctokit>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOctokit = createMockOctokit();
  });

  it("creates a label via octokit", async () => {
    await createLabel(
      mockOctokit as unknown as ReturnType<typeof github.getOctokit>,
      "my-label",
      "owner",
      "repo",
    );

    expect(mockOctokit.rest.issues.createLabel).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      name: "my-label",
    });
    expect(core.info).toHaveBeenCalledWith("Created label: my-label");
  });

  it("ignores 422 error (label already exists)", async () => {
    const error = new Error("Validation Failed") as Error & { status: number };
    error.status = 422;
    mockOctokit.rest.issues.createLabel.mockRejectedValue(error);

    await createLabel(
      mockOctokit as unknown as ReturnType<typeof github.getOctokit>,
      "my-label",
      "owner",
      "repo",
    );

    expect(core.info).toHaveBeenCalledWith("Label my-label already exists");
  });

  it("re-throws non-422 errors", async () => {
    const error = new Error("Server Error") as Error & { status: number };
    error.status = 500;
    mockOctokit.rest.issues.createLabel.mockRejectedValue(error);

    await expect(
      createLabel(
        mockOctokit as unknown as ReturnType<typeof github.getOctokit>,
        "my-label",
        "owner",
        "repo",
      ),
    ).rejects.toThrow("Server Error");
  });
});

describe("addLabelToPR", () => {
  let mockOctokit: ReturnType<typeof createMockOctokit>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOctokit = createMockOctokit();
  });

  it("adds label to PR via octokit", async () => {
    await addLabelToPR(
      mockOctokit as unknown as ReturnType<typeof github.getOctokit>,
      "42",
      "my-label",
      "owner",
      "repo",
    );

    expect(mockOctokit.rest.issues.addLabels).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 42,
      labels: ["my-label"],
    });
    expect(core.info).toHaveBeenCalledWith("Added label my-label to PR #42");
  });
});

describe("run", () => {
  let mockOctokit: ReturnType<typeof createMockOctokit>;
  let mockExecutor: ReturnType<typeof createMockExecutor>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockOctokit = createMockOctokit();
    mockExecutor = createMockExecutor();

    vi.mocked(github.getOctokit).mockReturnValue(
      mockOctokit as unknown as ReturnType<typeof github.getOctokit>,
    );
    vi.mocked(lib.getConfig).mockResolvedValue({
      git_root_dir: "/repo",
      skip_create_pr: false,
      draft_pr: false,
      label_prefixes: { tfmigrate: "tfmigrate:" },
      securefix_action: {},
    } as unknown as Awaited<ReturnType<typeof lib.getConfig>>);
    vi.mocked(getTargetConfig.getTargetConfig).mockResolvedValue({
      working_directory: "aws/dev",
      target: "aws/dev",
      s3_bucket_name_tfmigrate_history: "my-s3-bucket",
    } as unknown as Awaited<
      ReturnType<typeof getTargetConfig.getTargetConfig>
    >);
    vi.mocked(aqua.NewExecutor).mockResolvedValue(
      mockExecutor as unknown as Awaited<ReturnType<typeof aqua.NewExecutor>>,
    );
    vi.mocked(git.getModifiedFiles).mockResolvedValue([
      ".tfmigrate.hcl",
      "tfmigrate/20240101120000_main.hcl",
    ]);
    vi.mocked(commit.create).mockResolvedValue("");

    // Default fs mocks for run: directories don't exist, template reads succeed
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockReturnValue("template content");
  });

  it("creates directories, tfmigrate.hcl, migration file, commits, creates PR (happy path)", async () => {
    await run(defaultRunInput);

    // Creates parent dir and working dir
    expect(fs.mkdirSync).toHaveBeenCalled();

    // Creates commit with PR
    expect(commit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        githubToken: "test-token",
        branch: expect.stringContaining("scaffold-tfmigrate-aws__dev-"),
        pr: expect.objectContaining({
          title: "Scaffold a tfmigrate migration (aws/dev)",
          assignees: ["user1"],
        }),
      }),
    );
  });

  it("returns early when no modified files found", async () => {
    vi.mocked(git.getModifiedFiles).mockResolvedValue([]);

    await run(defaultRunInput);

    expect(core.info).toHaveBeenCalledWith("No files to commit");
    expect(commit.create).not.toHaveBeenCalled();
  });

  it("when prNumber is set: checks out the PR, gets current branch, adds label", async () => {
    vi.mocked(git.getCurrentBranch).mockResolvedValue("pr-branch");

    await run({ ...defaultRunInput, prNumber: "42" });

    // Checks out PR
    expect(mockExecutor.exec).toHaveBeenCalledWith(
      "gh",
      ["pr", "checkout", "42"],
      expect.objectContaining({
        cwd: "/repo",
        env: { GITHUB_TOKEN: "test-token" },
      }),
    );

    // Gets current branch
    expect(git.getCurrentBranch).toHaveBeenCalledWith("/repo");

    // commit.create is called with pr: undefined (shouldSkipPr = true when prNumber is set)
    expect(commit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        branch: "pr-branch",
        pr: undefined,
      }),
    );

    // Adds label to PR
    expect(mockOctokit.rest.issues.addLabels).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      issue_number: 42,
      labels: ["tfmigrate:aws/dev"],
    });
  });

  it("when skip_create_pr is true: passes pr: undefined to commit.create and outputs guide", async () => {
    vi.mocked(lib.getConfig).mockResolvedValue({
      git_root_dir: "/repo",
      skip_create_pr: true,
      draft_pr: false,
      label_prefixes: { tfmigrate: "tfmigrate:" },
      securefix_action: {},
    } as unknown as Awaited<ReturnType<typeof lib.getConfig>>);

    await run(defaultRunInput);

    expect(commit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pr: undefined,
      }),
    );

    // Creates label and outputs guide
    expect(mockOctokit.rest.issues.createLabel).toHaveBeenCalled();
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      "/tmp/step-summary",
      expect.stringContaining("gh pr create"),
    );
  });

  it("uses Handlebars templates from scaffold_tfmigrate config when configured", async () => {
    vi.mocked(lib.getConfig).mockResolvedValue({
      git_root_dir: "/repo",
      skip_create_pr: false,
      draft_pr: false,
      label_prefixes: { tfmigrate: "tfmigrate:" },
      securefix_action: {},
      scaffold_tfmigrate: {
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
          title: "Scaffold aws/dev",
          body: "Body for /repo/aws/dev by user1",
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
          title: "Scaffold a tfmigrate migration (aws/dev)",
          body: expect.stringContaining("@user1"),
          comment: expect.stringContaining("@user1"),
        }),
      }),
    );
  });

  it("sets assignees to undefined when actor is empty", async () => {
    await run({ ...defaultRunInput, actor: "" });

    expect(commit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pr: expect.objectContaining({
          assignees: undefined,
        }),
      }),
    );
  });

  it("sets labels to [label] when label is non-empty", async () => {
    await run(defaultRunInput);

    expect(commit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pr: expect.objectContaining({
          labels: ["tfmigrate:aws/dev"],
        }),
      }),
    );
  });
});
