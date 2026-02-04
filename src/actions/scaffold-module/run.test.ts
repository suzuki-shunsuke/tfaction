import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@actions/core", () => ({
  info: vi.fn(),
}));

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  return {
    ...actual,
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readdirSync: vi.fn(),
    copyFileSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    statSync: vi.fn(),
  };
});

vi.mock("../../lib", () => ({
  getConfig: vi.fn(),
}));

vi.mock("../../aqua", () => ({
  NewExecutor: vi.fn(),
}));

vi.mock("../../lib/git", () => ({
  getModifiedFiles: vi.fn(),
}));

import * as core from "@actions/core";
import * as fs from "fs";

import * as lib from "../../lib";
import * as aqua from "../../aqua";
import * as git from "../../lib/git";

import { copyDirectory, replaceInFiles, run, type RunInput } from "./run";

const createMockExecutor = () => ({
  exec: vi.fn().mockResolvedValue(0),
});

// Use ReturnType<typeof vi.fn> to avoid type issues with readdirSync overloads
const mockedReaddirSync = fs.readdirSync as unknown as ReturnType<typeof vi.fn>;

const createMockDirent = (name: string, isDir: boolean) => ({
  name,
  isDirectory: () => isDir,
  isFile: () => !isDir,
});

const defaultRunInput: RunInput = {
  githubToken: "test-token",
  modulePath: "modules/my-module",
  moduleTemplateDir: "templates/module",
  repository: "owner/repo",
};

describe("copyDirectory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates destination directory if it does not exist", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    mockedReaddirSync.mockReturnValue([]);

    copyDirectory("/src", "/dest");

    expect(fs.mkdirSync).toHaveBeenCalledWith("/dest", { recursive: true });
  });

  it("does not create destination directory if it already exists", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    mockedReaddirSync.mockReturnValue([]);

    copyDirectory("/src", "/dest");

    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });

  it("copies files from source to destination", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    mockedReaddirSync.mockReturnValue([
      createMockDirent("file1.txt", false),
      createMockDirent("file2.txt", false),
    ]);

    copyDirectory("/src", "/dest");

    expect(fs.copyFileSync).toHaveBeenCalledWith(
      "/src/file1.txt",
      "/dest/file1.txt",
    );
    expect(fs.copyFileSync).toHaveBeenCalledWith(
      "/src/file2.txt",
      "/dest/file2.txt",
    );
  });

  it("recursively copies subdirectories", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);

    // First call: root directory has a subdir and a file
    mockedReaddirSync
      .mockReturnValueOnce([
        createMockDirent("subdir", true),
        createMockDirent("root.txt", false),
      ])
      // Second call: subdir has a file
      .mockReturnValueOnce([createMockDirent("nested.txt", false)]);

    copyDirectory("/src", "/dest");

    expect(fs.copyFileSync).toHaveBeenCalledWith(
      "/src/root.txt",
      "/dest/root.txt",
    );
    expect(fs.copyFileSync).toHaveBeenCalledWith(
      "/src/subdir/nested.txt",
      "/dest/subdir/nested.txt",
    );
  });
});

describe("replaceInFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads modified files and applies Handlebars templates", async () => {
    vi.mocked(git.getModifiedFiles).mockResolvedValue(["main.tf"]);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ isFile: () => true } as fs.Stats);
    vi.mocked(fs.readFileSync).mockReturnValue(
      "module {{module_name}} in {{module_path}}",
    );

    await replaceInFiles("/work", {
      module_name: "my-mod",
      module_path: "/work/my-mod",
    });

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/work/main.tf",
      "module my-mod in /work/my-mod",
    );
  });

  it("skips files where content does not change", async () => {
    vi.mocked(git.getModifiedFiles).mockResolvedValue(["unchanged.tf"]);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ isFile: () => true } as fs.Stats);
    vi.mocked(fs.readFileSync).mockReturnValue("no placeholders here");

    await replaceInFiles("/work", { module_name: "test" });

    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it("skips non-existent files", async () => {
    vi.mocked(git.getModifiedFiles).mockResolvedValue(["missing.tf"]);
    vi.mocked(fs.existsSync).mockReturnValue(false);

    await replaceInFiles("/work", { module_name: "test" });

    expect(fs.readFileSync).not.toHaveBeenCalled();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it("skips directories", async () => {
    vi.mocked(git.getModifiedFiles).mockResolvedValue(["somedir"]);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isFile: () => false,
    } as fs.Stats);

    await replaceInFiles("/work", { module_name: "test" });

    expect(fs.readFileSync).not.toHaveBeenCalled();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });
});

describe("run", () => {
  let mockExecutor: ReturnType<typeof createMockExecutor>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecutor = createMockExecutor();
    vi.mocked(lib.getConfig).mockResolvedValue({
      git_root_dir: "/repo",
    } as Awaited<ReturnType<typeof lib.getConfig>>);
    vi.mocked(aqua.NewExecutor).mockResolvedValue(
      mockExecutor as unknown as Awaited<ReturnType<typeof aqua.NewExecutor>>,
    );
    vi.mocked(git.getModifiedFiles).mockResolvedValue([]);
  });

  it("throws when modulePath is empty", async () => {
    await expect(run({ ...defaultRunInput, modulePath: "" })).rejects.toThrow(
      "env.TFACTION_MODULE_PATH is required",
    );
  });

  it("throws when moduleTemplateDir is empty", async () => {
    await expect(
      run({ ...defaultRunInput, moduleTemplateDir: "" }),
    ).rejects.toThrow("env.TFACTION_MODULE_TEMPLATE_DIR is required");
  });

  it("throws when module path already exists", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);

    await expect(run(defaultRunInput)).rejects.toThrow(
      "file exists: /repo/modules/my-module",
    );
  });

  it("throws when template directory does not exist", async () => {
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(false) // modulePath does not exist
      .mockReturnValueOnce(false); // templateDir does not exist

    await expect(run(defaultRunInput)).rejects.toThrow(
      "/repo/templates/module doesn't exist",
    );
  });

  it("throws when template path is not a directory", async () => {
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(false) // modulePath does not exist
      .mockReturnValueOnce(true); // templateDir exists
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => false,
    } as fs.Stats);

    await expect(run(defaultRunInput)).rejects.toThrow(
      "/repo/templates/module doesn't exist",
    );
  });

  it("creates parent directory if it does not exist", async () => {
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(false) // modulePath does not exist
      .mockReturnValueOnce(true) // templateDir exists
      .mockReturnValueOnce(false) // parentDir does not exist
      .mockReturnValue(true); // subsequent calls
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => true,
    } as fs.Stats);
    mockedReaddirSync.mockReturnValue([]);

    await run(defaultRunInput);

    expect(fs.mkdirSync).toHaveBeenCalledWith("/repo/modules", {
      recursive: true,
    });
    expect(core.info).toHaveBeenCalledWith(
      "Created parent directory: /repo/modules",
    );
  });

  it("does not create parent directory if it already exists", async () => {
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(false) // modulePath does not exist
      .mockReturnValueOnce(true) // templateDir exists
      .mockReturnValueOnce(true) // parentDir exists
      .mockReturnValue(true); // subsequent calls
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => true,
    } as fs.Stats);
    mockedReaddirSync.mockReturnValue([]);

    await run(defaultRunInput);

    expect(fs.mkdirSync).not.toHaveBeenCalledWith("/repo/modules", {
      recursive: true,
    });
  });

  it("writes tfaction_module.yaml with {}\\n", async () => {
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(false) // modulePath
      .mockReturnValueOnce(true) // templateDir
      .mockReturnValueOnce(true) // parentDir
      .mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => true,
    } as fs.Stats);
    mockedReaddirSync.mockReturnValue([]);

    await run(defaultRunInput);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/repo/modules/my-module/tfaction_module.yaml",
      "{}\n",
    );
    expect(core.info).toHaveBeenCalledWith("Created tfaction_module.yaml");
  });

  it("runs terraform-docs and writes README.md", async () => {
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(false) // modulePath
      .mockReturnValueOnce(true) // templateDir
      .mockReturnValueOnce(true) // parentDir
      .mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => true,
    } as fs.Stats);
    mockedReaddirSync.mockReturnValue([]);

    mockExecutor.exec.mockImplementation(
      (
        _cmd: string,
        _args: string[],
        opts: { listeners?: { stdout?: (data: Buffer) => void } },
      ) => {
        if (opts?.listeners?.stdout) {
          opts.listeners.stdout(Buffer.from("# My Module\n"));
        }
        return Promise.resolve(0);
      },
    );

    await run(defaultRunInput);

    expect(mockExecutor.exec).toHaveBeenCalledWith(
      "terraform-docs",
      ["."],
      expect.objectContaining({
        cwd: "/repo/modules/my-module",
      }),
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/repo/modules/my-module/README.md",
      "# My Module\n",
    );
    expect(core.info).toHaveBeenCalledWith("Running terraform-docs");
    expect(core.info).toHaveBeenCalledWith("Generated README.md");
  });

  it("logs appropriate messages during execution", async () => {
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(false) // modulePath
      .mockReturnValueOnce(true) // templateDir
      .mockReturnValueOnce(true) // parentDir
      .mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => true,
    } as fs.Stats);
    mockedReaddirSync.mockReturnValue([]);

    await run(defaultRunInput);

    expect(core.info).toHaveBeenCalledWith(
      "Copied template from /repo/templates/module to /repo/modules/my-module",
    );
    expect(core.info).toHaveBeenCalledWith("Created tfaction_module.yaml");
    expect(core.info).toHaveBeenCalledWith("Running terraform-docs");
    expect(core.info).toHaveBeenCalledWith("Generated README.md");
  });
});
