import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@actions/core", () => ({
  info: vi.fn(),
  setOutput: vi.fn(),
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
  GitHubActionPath: "/action-path",
}));

vi.mock("../../lib/git", () => ({
  getModifiedFiles: vi.fn(),
}));

vi.mock("../../aqua", () => ({
  NewExecutor: vi.fn(),
}));

vi.mock("../get-target-config", () => ({
  getTargetConfig: vi.fn(),
}));

import * as core from "@actions/core";
import * as fs from "fs";

import * as lib from "../../lib";
import * as aqua from "../../aqua";
import * as git from "../../lib/git";
import * as getTargetConfig from "../get-target-config";

import { copyDirectory, replaceInFiles, run, type RunInput } from "./run";

// Use ReturnType<typeof vi.fn> to avoid type issues with readdirSync overloads
const mockedReaddirSync = fs.readdirSync as unknown as ReturnType<typeof vi.fn>;

const createMockDirent = (name: string, isDir: boolean) => ({
  name,
  isDirectory: () => isDir,
  isFile: () => !isDir,
});

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

    // First call: top-level directory
    mockedReaddirSync
      .mockReturnValueOnce([
        createMockDirent("subdir", true),
        createMockDirent("file.txt", false),
      ])
      // Second call: subdirectory
      .mockReturnValueOnce([createMockDirent("nested.txt", false)]);

    copyDirectory("/src", "/dest");

    expect(fs.copyFileSync).toHaveBeenCalledWith(
      "/src/file.txt",
      "/dest/file.txt",
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
      "bucket = {{s3_bucket_name_for_tfmigrate_history}}",
    );

    await replaceInFiles("/work", {
      s3_bucket_name_for_tfmigrate_history: "my-bucket",
    });

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/work/main.tf",
      "bucket = my-bucket",
    );
  });

  it("skips files where content does not change", async () => {
    vi.mocked(git.getModifiedFiles).mockResolvedValue(["unchanged.tf"]);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ isFile: () => true } as fs.Stats);
    vi.mocked(fs.readFileSync).mockReturnValue("no placeholders here");

    await replaceInFiles("/work", { key: "value" });

    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it("skips non-existent files", async () => {
    vi.mocked(git.getModifiedFiles).mockResolvedValue(["missing.tf"]);
    vi.mocked(fs.existsSync).mockReturnValue(false);

    await replaceInFiles("/work", { key: "value" });

    expect(fs.statSync).not.toHaveBeenCalled();
    expect(fs.readFileSync).not.toHaveBeenCalled();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it("skips directories", async () => {
    vi.mocked(git.getModifiedFiles).mockResolvedValue(["subdir"]);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isFile: () => false,
    } as fs.Stats);

    await replaceInFiles("/work", { key: "value" });

    expect(fs.readFileSync).not.toHaveBeenCalled();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });
});

describe("run", () => {
  const defaultInput: RunInput = {
    target: "aws/dev",
    workingDir: "aws/dev",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(lib.getConfig).mockResolvedValue({
      git_root_dir: "/repo",
      working_directory_file: "tfaction.yaml",
    } as unknown as Awaited<ReturnType<typeof lib.getConfig>>);

    vi.mocked(getTargetConfig.getTargetConfig).mockResolvedValue({
      working_directory: "aws/dev",
      target: "aws/dev",
      template_dir: undefined,
      s3_bucket_name_tfmigrate_history: undefined,
      gcs_bucket_name_tfmigrate_history: undefined,
    } as unknown as Awaited<
      ReturnType<typeof getTargetConfig.getTargetConfig>
    >);

    vi.mocked(git.getModifiedFiles).mockResolvedValue([]);
    vi.mocked(fs.existsSync).mockReturnValue(true);
  });

  it("creates parent directory if it does not exist", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    mockedReaddirSync.mockReturnValue([]);

    await run(defaultInput);

    expect(fs.mkdirSync).toHaveBeenCalledWith("/repo/aws", { recursive: true });
    expect(core.info).toHaveBeenCalledWith(
      "Created parent directory: /repo/aws",
    );
  });

  it("copies template directory when templateDir is configured", async () => {
    vi.mocked(getTargetConfig.getTargetConfig).mockResolvedValue({
      working_directory: "aws/dev",
      target: "aws/dev",
      template_dir: "templates/aws",
      s3_bucket_name_tfmigrate_history: undefined,
      gcs_bucket_name_tfmigrate_history: undefined,
    } as unknown as Awaited<
      ReturnType<typeof getTargetConfig.getTargetConfig>
    >);

    mockedReaddirSync.mockReturnValue([]);

    await run(defaultInput);

    expect(core.info).toHaveBeenCalledWith(
      "Copied template from /repo/templates/aws to /repo/aws/dev",
    );
  });

  it("creates working directory when template_dir is not set", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    mockedReaddirSync.mockReturnValue([]);

    await run(defaultInput);

    expect(core.info).toHaveBeenCalledWith(
      "Created working directory: /repo/aws/dev",
    );
  });

  it("creates working directory file (e.g., tfaction.yaml)", async () => {
    await run(defaultInput);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/repo/aws/dev/tfaction.yaml",
      "{}\n",
    );
    expect(core.info).toHaveBeenCalledWith("Created tfaction.yaml");
  });

  it("copies tfmigrate.hcl for S3 backend when s3Bucket is configured", async () => {
    vi.mocked(getTargetConfig.getTargetConfig).mockResolvedValue({
      working_directory: "aws/dev",
      target: "aws/dev",
      template_dir: undefined,
      s3_bucket_name_tfmigrate_history: "my-s3-bucket",
      gcs_bucket_name_tfmigrate_history: undefined,
    } as unknown as Awaited<
      ReturnType<typeof getTargetConfig.getTargetConfig>
    >);

    await run(defaultInput);

    expect(fs.copyFileSync).toHaveBeenCalledWith(
      "/action-path/install/tfmigrate.hcl",
      "/repo/aws/dev/.tfmigrate.hcl",
    );
    expect(core.info).toHaveBeenCalledWith(
      "Copied tfmigrate.hcl for S3 backend",
    );
  });

  it("copies tfmigrate.hcl for GCS backend when gcsBucket is configured", async () => {
    vi.mocked(getTargetConfig.getTargetConfig).mockResolvedValue({
      working_directory: "aws/dev",
      target: "aws/dev",
      template_dir: undefined,
      s3_bucket_name_tfmigrate_history: undefined,
      gcs_bucket_name_tfmigrate_history: "my-gcs-bucket",
    } as unknown as Awaited<
      ReturnType<typeof getTargetConfig.getTargetConfig>
    >);

    await run(defaultInput);

    expect(fs.copyFileSync).toHaveBeenCalledWith(
      "/action-path/install/tfmigrate-gcs.hcl",
      "/repo/aws/dev/.tfmigrate.hcl",
    );
    expect(core.info).toHaveBeenCalledWith(
      "Copied tfmigrate.hcl for GCS backend",
    );
  });

  it("replaces placeholders in files", async () => {
    vi.mocked(getTargetConfig.getTargetConfig).mockResolvedValue({
      working_directory: "aws/dev",
      target: "aws/dev",
      template_dir: undefined,
      s3_bucket_name_tfmigrate_history: "my-bucket",
      gcs_bucket_name_tfmigrate_history: undefined,
    } as unknown as Awaited<
      ReturnType<typeof getTargetConfig.getTargetConfig>
    >);

    vi.mocked(git.getModifiedFiles).mockResolvedValue(["config.tf"]);
    vi.mocked(fs.statSync).mockReturnValue({ isFile: () => true } as fs.Stats);
    vi.mocked(fs.readFileSync).mockReturnValue(
      "bucket = {{s3_bucket_name_for_tfmigrate_history}}",
    );

    await run(defaultInput);

    expect(git.getModifiedFiles).toHaveBeenCalledWith(".", "/repo/aws/dev");
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/repo/aws/dev/config.tf",
      "bucket = my-bucket",
    );
  });

  it("sets working_directory output", async () => {
    await run(defaultInput);

    expect(core.setOutput).toHaveBeenCalledWith(
      "working_directory",
      "/repo/aws/dev",
    );
  });

  describe("type=module", () => {
    const moduleInput: RunInput = {
      target: "modules/vpc",
      workingDir: "modules/vpc",
      githubToken: "test-token",
      repository: "owner/repo",
    };

    beforeEach(() => {
      vi.mocked(getTargetConfig.getTargetConfig).mockResolvedValue({
        working_directory: "modules/vpc",
        target: "modules/vpc",
        type: "module",
        template_dir: undefined,
        s3_bucket_name_tfmigrate_history: undefined,
        gcs_bucket_name_tfmigrate_history: undefined,
        enable_terraform_docs: false,
      } as unknown as Awaited<
        ReturnType<typeof getTargetConfig.getTargetConfig>
      >);
    });

    it("creates tfaction.yaml with type: module", async () => {
      await run(moduleInput);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "/repo/modules/vpc/tfaction.yaml",
        "type: module\n",
      );
      expect(core.info).toHaveBeenCalledWith(
        "Created tfaction.yaml with type: module",
      );
    });

    it("skips tfmigrate.hcl even when S3 bucket is configured", async () => {
      vi.mocked(getTargetConfig.getTargetConfig).mockResolvedValue({
        working_directory: "modules/vpc",
        target: "modules/vpc",
        type: "module",
        template_dir: undefined,
        s3_bucket_name_tfmigrate_history: "my-bucket",
        gcs_bucket_name_tfmigrate_history: undefined,
        enable_terraform_docs: false,
      } as unknown as Awaited<
        ReturnType<typeof getTargetConfig.getTargetConfig>
      >);

      await run(moduleInput);

      expect(fs.copyFileSync).not.toHaveBeenCalled();
    });

    it("uses module-specific template vars", async () => {
      vi.mocked(git.getModifiedFiles).mockResolvedValue(["main.tf"]);
      vi.mocked(fs.statSync).mockReturnValue({
        isFile: () => true,
      } as fs.Stats);
      vi.mocked(fs.readFileSync).mockReturnValue(
        "module {{module_name}} ref={{ref}}",
      );

      await run(moduleInput);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "/repo/modules/vpc/main.tf",
        "module vpc ref=module_modules_vpc_v0.1.0",
      );
    });

    it("runs terraform-docs when enable_terraform_docs is true", async () => {
      vi.mocked(getTargetConfig.getTargetConfig).mockResolvedValue({
        working_directory: "modules/vpc",
        target: "modules/vpc",
        type: "module",
        template_dir: undefined,
        s3_bucket_name_tfmigrate_history: undefined,
        gcs_bucket_name_tfmigrate_history: undefined,
        enable_terraform_docs: true,
      } as unknown as Awaited<
        ReturnType<typeof getTargetConfig.getTargetConfig>
      >);

      const mockExecutor = {
        exec: vi
          .fn()
          .mockImplementation(
            (
              _cmd: string,
              _args: string[],
              opts: { listeners?: { stdout?: (data: Buffer) => void } },
            ) => {
              if (opts?.listeners?.stdout) {
                opts.listeners.stdout(Buffer.from("# VPC Module\n"));
              }
              return Promise.resolve(0);
            },
          ),
      };
      vi.mocked(aqua.NewExecutor).mockResolvedValue(
        mockExecutor as unknown as Awaited<ReturnType<typeof aqua.NewExecutor>>,
      );

      await run(moduleInput);

      expect(mockExecutor.exec).toHaveBeenCalledWith(
        "terraform-docs",
        ["."],
        expect.objectContaining({
          cwd: "/repo/modules/vpc",
        }),
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "/repo/modules/vpc/README.md",
        "# VPC Module\n",
      );
      expect(core.info).toHaveBeenCalledWith("Running terraform-docs");
      expect(core.info).toHaveBeenCalledWith("Generated README.md");
    });

    it("skips terraform-docs when enable_terraform_docs is false", async () => {
      await run(moduleInput);

      expect(aqua.NewExecutor).not.toHaveBeenCalled();
      expect(core.info).not.toHaveBeenCalledWith("Running terraform-docs");
    });
  });
});
