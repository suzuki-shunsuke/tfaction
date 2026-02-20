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
  escapeForShellDoubleQuote,
  generateBranchName,
  writeSkipCreatePrSummary,
  run,
  type RunInput,
} from "./run";

describe("escapeForShellDoubleQuote", () => {
  it("leaves normal strings unchanged", () => {
    expect(escapeForShellDoubleQuote("hello world")).toBe("hello world");
  });

  it("escapes backslashes", () => {
    expect(escapeForShellDoubleQuote("a\\b")).toBe("a\\\\b");
  });

  it("escapes double quotes", () => {
    expect(escapeForShellDoubleQuote('say "hi"')).toBe('say \\"hi\\"');
  });

  it("escapes dollar signs", () => {
    expect(escapeForShellDoubleQuote("$HOME")).toBe("\\$HOME");
  });

  it("escapes backticks", () => {
    expect(escapeForShellDoubleQuote("`cmd`")).toBe("\\`cmd\\`");
  });

  it("escapes all special characters together", () => {
    expect(escapeForShellDoubleQuote('a\\b"c$d`e')).toBe('a\\\\b\\"c\\$d\\`e');
  });
});

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
      false,
      "Scaffold a working directory (my/target)",
      "This pull request was created by GitHub Actions",
    );

    expect(core.summary.addRaw).toHaveBeenCalledWith(
      expect.stringContaining("gh pr create"),
    );
    expect(core.summary.write).toHaveBeenCalled();
  });

  it("includes -d flag when draftPr is true", () => {
    writeSkipCreatePrSummary("owner/repo", "branch", true, "title", "body");

    const summaryArg = vi.mocked(core.summary.addRaw).mock.calls[0][0];
    expect(summaryArg).toContain("-d ");
  });

  it("omits -d flag when draftPr is false", () => {
    writeSkipCreatePrSummary("owner/repo", "branch", false, "title", "body");

    const summaryArg = vi.mocked(core.summary.addRaw).mock.calls[0][0];
    expect(summaryArg).not.toContain("-d ");
  });

  it("includes prTitle and prBody in the summary", () => {
    writeSkipCreatePrSummary(
      "owner/repo",
      "branch",
      false,
      "My PR Title",
      "My PR Body",
    );

    const summaryArg = vi.mocked(core.summary.addRaw).mock.calls[0][0];
    expect(summaryArg).toContain("My PR Title");
    expect(summaryArg).toContain("My PR Body");
  });

  it("escapes special characters in prTitle and prBody", () => {
    writeSkipCreatePrSummary(
      "owner/repo",
      "branch",
      false,
      'Title with "quotes" and $var',
      "Body with `backticks` and \\backslash",
    );

    const summaryArg = vi.mocked(core.summary.addRaw).mock.calls[0][0];
    expect(summaryArg).toContain('Title with \\"quotes\\" and \\$var');
    expect(summaryArg).toContain("Body with \\`backticks\\` and \\\\backslash");
  });
});

describe("run", () => {
  const defaultRunInput: RunInput = {
    githubToken: "test-token",
    csmAppId: "",
    csmAppPrivateKey: "",
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
      csm_actions: {},
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
      csm_actions: {},
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
      csm_actions: {},
    } as unknown as Awaited<ReturnType<typeof lib.getConfig>>);

    await run(defaultRunInput);

    const summaryArg = vi.mocked(core.summary.addRaw).mock.calls[0][0];
    expect(summaryArg).toContain("gh pr create");
    expect(summaryArg).toContain("Scaffold a working directory (my/target)");
    expect(core.summary.write).toHaveBeenCalled();
  });

  it("uses Handlebars templates from scaffold_working_directory config", async () => {
    vi.mocked(lib.getConfig).mockResolvedValue({
      skip_create_pr: false,
      draft_pr: false,
      csm_actions: {},
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

  describe("type=module", () => {
    beforeEach(() => {
      vi.mocked(getTargetConfig.getTargetConfig).mockResolvedValue({
        working_directory: "modules/vpc",
        target: "modules/vpc",
        type: "module",
      } as unknown as Awaited<
        ReturnType<typeof getTargetConfig.getTargetConfig>
      >);
    });

    it("uses scaffold-working-directory- branch prefix", async () => {
      await run(defaultRunInput);

      expect(commit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          branch: expect.stringContaining(
            "scaffold-working-directory-modules__vpc-",
          ),
        }),
      );
    });

    it("uses module commit message", async () => {
      await run(defaultRunInput);

      expect(commit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          commitMessage: "chore(modules/vpc): scaffold a Terraform Module",
        }),
      );
    });

    it("uses default module PR title/body", async () => {
      await run(defaultRunInput);

      expect(commit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          pr: expect.objectContaining({
            title: "Scaffold a Terraform Module (modules/vpc)",
            body: expect.stringContaining("GitHub Actions"),
          }),
        }),
      );
    });

    it("uses scaffold_module config templates", async () => {
      vi.mocked(lib.getConfig).mockResolvedValue({
        skip_create_pr: false,
        draft_pr: false,
        csm_actions: {},
        scaffold_module: {
          pull_request: {
            title: "Module {{module_path}}",
            body: "Module PR by {{actor}}",
            comment: "Comment {{run_url}}",
          },
        },
      } as unknown as Awaited<ReturnType<typeof lib.getConfig>>);

      await run(defaultRunInput);

      expect(commit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          pr: expect.objectContaining({
            title: "Module modules/vpc",
            body: "Module PR by user1",
            comment: expect.stringContaining(defaultRunInput.runURL),
          }),
        }),
      );
    });

    it("uses module summary when skip_create_pr=true", async () => {
      vi.mocked(lib.getConfig).mockResolvedValue({
        skip_create_pr: true,
        draft_pr: false,
        csm_actions: {},
      } as unknown as Awaited<ReturnType<typeof lib.getConfig>>);

      await run(defaultRunInput);

      const summaryArg = vi.mocked(core.summary.addRaw).mock.calls[0][0];
      expect(summaryArg).toContain("Scaffold a Terraform Module");
    });
  });
});
