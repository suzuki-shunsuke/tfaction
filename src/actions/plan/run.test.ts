import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as core from "@actions/core";
import {
  runTerraformPlan,
  runTfmigratePlan,
  main,
  type RunInputs,
} from "./run";
import type * as aqua from "../../aqua";
import type * as getTargetConfig from "../get-target-config";

// Mock modules
vi.mock("@actions/core", () => ({
  setOutput: vi.fn(),
  startGroup: vi.fn(),
  endGroup: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}));

vi.mock("@actions/artifact", () => ({
  DefaultArtifactClient: class MockArtifactClient {
    uploadArtifact = vi.fn().mockResolvedValue({});
  },
}));

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof fs>("fs");
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdtempSync: vi.fn(),
  };
});

vi.mock("../../lib", async () => {
  const actual = await vi.importActual("../../lib");
  return {
    ...actual,
    getConfig: vi.fn(),
    GitHubActionPath: "/mock/action/path",
    GitHubCommentConfig: "/mock/config/github-comment.yaml",
    aquaGlobalConfig: "/mock/config/aqua.yaml",
  };
});

vi.mock("../../lib/env", () => ({
  all: {
    TFMIGRATE_EXEC_PATH: "",
  },
}));

vi.mock("../../aqua", () => ({
  NewExecutor: vi.fn(),
}));

vi.mock("../../conftest", () => ({
  run: vi.fn(),
}));

// Helper to create a mock executor
const createMockExecutor = () => ({
  exec: vi.fn().mockResolvedValue(0),
  getExecOutput: vi.fn().mockResolvedValue({
    exitCode: 0,
    stdout: "{}",
    stderr: "",
  }),
  installDir: "/mock/install",
  githubToken: "mock-token",
  env: vi.fn(),
  buildArgs: vi.fn(),
});

type MockExecutor = ReturnType<typeof createMockExecutor>;

// Base inputs for tests
const createBaseInputs = (executor: MockExecutor) => ({
  githubToken: "test-token",
  workingDirectory: "/test/working/dir",
  renovateLogin: "renovate[bot]",
  destroy: false,
  tfCommand: "terraform",
  target: "aws/test/dev",
  executor: executor as unknown as aqua.Executor,
});

describe("runTerraformPlan", () => {
  let mockExecutor: MockExecutor;
  let tempDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecutor = createMockExecutor();
    tempDir = "/tmp/tfaction-test123";
    vi.mocked(fs.mkdtempSync).mockReturnValue(tempDir);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns correctly when detailedExitcode=0 (no changes)", async () => {
    mockExecutor.getExecOutput
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "",
        stderr: "",
      })
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: '{"plan": "empty"}',
        stderr: "",
      });

    const inputs = createBaseInputs(mockExecutor);
    const result = await runTerraformPlan(inputs);

    expect(result.detailedExitcode).toBe(0);
    expect(result.planBinary).toBe(path.join(tempDir, "tfplan.binary"));
    expect(result.planJson).toBe(path.join(tempDir, "tfplan.json"));
    expect(core.setOutput).toHaveBeenCalledWith("detailed_exitcode", 0);
    expect(core.setOutput).toHaveBeenCalledWith(
      "plan_binary",
      path.join(tempDir, "tfplan.binary"),
    );
  });

  it("throws error when detailedExitcode=1 (failure)", async () => {
    mockExecutor.getExecOutput.mockResolvedValueOnce({
      exitCode: 1,
      stdout: "",
      stderr: "Error: terraform plan failed",
    });

    const inputs = createBaseInputs(mockExecutor);

    await expect(runTerraformPlan(inputs)).rejects.toThrow(
      "terraform plan failed",
    );
    expect(core.setOutput).toHaveBeenCalledWith("detailed_exitcode", 1);
  });

  it("returns correctly when detailedExitcode=2 (has changes)", async () => {
    mockExecutor.getExecOutput
      .mockResolvedValueOnce({
        exitCode: 2,
        stdout: "",
        stderr: "",
      })
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: '{"plan": "changes"}',
        stderr: "",
      });

    const inputs = createBaseInputs(mockExecutor);
    const result = await runTerraformPlan(inputs);

    expect(result.detailedExitcode).toBe(2);
    expect(result.planBinary).toBe(path.join(tempDir, "tfplan.binary"));
    expect(result.planJson).toBe(path.join(tempDir, "tfplan.json"));
  });

  it("adds -destroy flag when destroy=true", async () => {
    mockExecutor.getExecOutput
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "",
        stderr: "",
      })
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "{}",
        stderr: "",
      });

    const inputs = {
      ...createBaseInputs(mockExecutor),
      destroy: true,
    };
    await runTerraformPlan(inputs);

    expect(mockExecutor.getExecOutput).toHaveBeenCalledWith(
      "tfcmt",
      expect.arrayContaining(["-destroy"]),
      expect.any(Object),
    );
    expect(core.warning).toHaveBeenCalledWith("The destroy option is enabled");
  });

  it("uses tfcmt-drift.yaml config when driftIssueNumber is set", async () => {
    mockExecutor.getExecOutput
      .mockResolvedValueOnce({
        exitCode: 2,
        stdout: "",
        stderr: "",
      })
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "{}",
        stderr: "",
      });

    const inputs = {
      ...createBaseInputs(mockExecutor),
      driftIssueNumber: "123",
    };

    await expect(runTerraformPlan(inputs)).rejects.toThrow(
      "Drift detected: terraform plan has changes",
    );

    expect(mockExecutor.getExecOutput).toHaveBeenCalledWith(
      "tfcmt",
      expect.arrayContaining([
        "-config",
        "/mock/action/path/install/tfcmt-drift.yaml",
      ]),
      expect.any(Object),
    );
  });

  it("throws error when drift detection mode and changes detected", async () => {
    mockExecutor.getExecOutput
      .mockResolvedValueOnce({
        exitCode: 2,
        stdout: "",
        stderr: "",
      })
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "{}",
        stderr: "",
      });

    const inputs = {
      ...createBaseInputs(mockExecutor),
      driftIssueNumber: "456",
    };

    await expect(runTerraformPlan(inputs)).rejects.toThrow(
      "Drift detected: terraform plan has changes",
    );
  });

  it("validates renovate change when PR author is renovate and no renovate-change label", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue("label1\nlabel2\n");

    mockExecutor.getExecOutput
      .mockResolvedValueOnce({
        exitCode: 2,
        stdout: "",
        stderr: "",
      })
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "{}",
        stderr: "",
      });
    mockExecutor.exec.mockResolvedValue(0);

    const inputs = {
      ...createBaseInputs(mockExecutor),
      prAuthor: "renovate[bot]",
      ciInfoTempDir: "/tmp/ci-info",
    };

    await expect(runTerraformPlan(inputs)).rejects.toThrow(
      "Renovate PR must have 'No change' or 'renovate-change' label",
    );
    expect(mockExecutor.exec).toHaveBeenCalledWith(
      "github-comment",
      expect.arrayContaining(["post", "-k", "renovate-plan-change"]),
      expect.any(Object),
    );
  });

  it("skips renovate validation when renovate-change label exists", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      "label1\nrenovate-change\nlabel2\n",
    );

    mockExecutor.getExecOutput
      .mockResolvedValueOnce({
        exitCode: 2,
        stdout: "",
        stderr: "",
      })
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "{}",
        stderr: "",
      });

    const inputs = {
      ...createBaseInputs(mockExecutor),
      prAuthor: "renovate[bot]",
      ciInfoTempDir: "/tmp/ci-info",
    };

    const result = await runTerraformPlan(inputs);
    expect(result.detailedExitcode).toBe(2);
  });

  it("skips renovate validation when PR author is not renovate", async () => {
    mockExecutor.getExecOutput
      .mockResolvedValueOnce({
        exitCode: 2,
        stdout: "",
        stderr: "",
      })
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "{}",
        stderr: "",
      });

    const inputs = {
      ...createBaseInputs(mockExecutor),
      prAuthor: "human-user",
      ciInfoTempDir: "/tmp/ci-info",
    };

    const result = await runTerraformPlan(inputs);
    expect(result.detailedExitcode).toBe(2);
    expect(mockExecutor.exec).not.toHaveBeenCalled();
  });

  it("writes plan JSON from terraform show output", async () => {
    const planJsonContent = '{"format_version": "1.0", "changes": []}';
    mockExecutor.getExecOutput
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "",
        stderr: "",
      })
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: planJsonContent,
        stderr: "",
      });

    const inputs = createBaseInputs(mockExecutor);
    await runTerraformPlan(inputs);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(tempDir, "tfplan.json"),
      planJsonContent,
    );
  });

  it("sets artifact name outputs with normalized target", async () => {
    mockExecutor.getExecOutput
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "",
        stderr: "",
      })
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "{}",
        stderr: "",
      });

    const inputs = createBaseInputs(mockExecutor);
    await runTerraformPlan(inputs);

    expect(core.setOutput).toHaveBeenCalledWith(
      "plan_binary_artifact_name",
      "terraform_plan_file_aws__test__dev",
    );
    expect(core.setOutput).toHaveBeenCalledWith(
      "plan_json_artifact_name",
      "terraform_plan_json_aws__test__dev",
    );
  });
});

describe("runTfmigratePlan", () => {
  let mockExecutor: MockExecutor;
  let tempDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecutor = createMockExecutor();
    tempDir = "/tmp/tfaction-test456";
    vi.mocked(fs.mkdtempSync).mockReturnValue(tempDir);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns changed=true when .tfmigrate.hcl is created from S3 template", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockReturnValue(
      'bucket = "%%S3_BUCKET_NAME_TFMIGRATE_HISTORY%%"\nname = "%%TARGET%%"',
    );

    const inputs = {
      ...createBaseInputs(mockExecutor),
      s3BucketNameTfmigrateHistory: "my-tfmigrate-bucket",
    };
    const result = await runTfmigratePlan(inputs);

    expect(result.changed).toBe(true);
    expect(result.planBinary).toBeUndefined();
    expect(result.planJson).toBeUndefined();
    expect(core.setOutput).toHaveBeenCalledWith("changed", "true");
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/test/working/dir/.tfmigrate.hcl",
      'bucket = "my-tfmigrate-bucket"\nname = "aws/test/dev"',
    );
  });

  it("returns changed=true when .tfmigrate.hcl is created from GCS template", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockReturnValue(
      'bucket = "%%GCS_BUCKET_NAME_TFMIGRATE_HISTORY%%"\nname = "%%TARGET%%"',
    );

    const inputs = {
      ...createBaseInputs(mockExecutor),
      gcsBucketNameTfmigrateHistory: "my-gcs-bucket",
    };
    const result = await runTfmigratePlan(inputs);

    expect(result.changed).toBe(true);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/test/working/dir/.tfmigrate.hcl",
      'bucket = "my-gcs-bucket"\nname = "aws/test/dev"',
    );
  });

  it("throws error when .tfmigrate.hcl does not exist and no bucket configured", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    mockExecutor.exec.mockResolvedValue(0);

    const inputs = createBaseInputs(mockExecutor);

    await expect(runTfmigratePlan(inputs)).rejects.toThrow(
      ".tfmigrate.hcl is required but neither S3 nor GCS bucket is configured",
    );
    expect(mockExecutor.exec).toHaveBeenCalledWith(
      "github-comment",
      expect.arrayContaining(["post", "-k", "tfmigrate-hcl-not-found"]),
      expect.any(Object),
    );
  });

  it("runs tfmigrate plan when .tfmigrate.hcl already exists", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    mockExecutor.exec.mockResolvedValue(0);
    mockExecutor.getExecOutput.mockResolvedValue({
      exitCode: 0,
      stdout: '{"plan": "result"}',
      stderr: "",
    });

    const inputs = createBaseInputs(mockExecutor);
    const result = await runTfmigratePlan(inputs);

    expect(result.changed).toBeUndefined();
    expect(result.planBinary).toBe(path.join(tempDir, "tfplan.binary"));
    expect(result.planJson).toBe(path.join(tempDir, "tfplan.json"));
    expect(mockExecutor.exec).toHaveBeenCalledWith(
      "tfmigrate",
      ["plan", "--out", path.join(tempDir, "tfplan.binary")],
      expect.objectContaining({
        cwd: "/test/working/dir",
        group: "tfmigrate plan",
      }),
    );
  });

  it("sets TFMIGRATE_EXEC_PATH when tfCommand is not terraform", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    mockExecutor.exec.mockResolvedValue(0);
    mockExecutor.getExecOutput.mockResolvedValue({
      exitCode: 0,
      stdout: "{}",
      stderr: "",
    });

    const inputs = {
      ...createBaseInputs(mockExecutor),
      tfCommand: "tofu",
    };
    await runTfmigratePlan(inputs);

    expect(mockExecutor.exec).toHaveBeenCalledWith(
      "tfmigrate",
      expect.any(Array),
      expect.objectContaining({
        env: expect.objectContaining({
          TFMIGRATE_EXEC_PATH: "tofu",
        }),
      }),
    );
  });

  it("runs terraform show to convert plan to JSON", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    mockExecutor.exec.mockResolvedValue(0);
    mockExecutor.getExecOutput.mockResolvedValue({
      exitCode: 0,
      stdout: '{"changes": []}',
      stderr: "",
    });

    const inputs = createBaseInputs(mockExecutor);
    await runTfmigratePlan(inputs);

    expect(mockExecutor.getExecOutput).toHaveBeenCalledWith(
      "terraform",
      ["show", "-json", path.join(tempDir, "tfplan.binary")],
      expect.objectContaining({
        cwd: "/test/working/dir",
        silent: true,
      }),
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(tempDir, "tfplan.json"),
      '{"changes": []}',
    );
  });
});

describe("main", () => {
  let mockExecutor: MockExecutor;
  const mockGetConfig = vi.fn();
  const mockNewExecutor = vi.fn();
  const mockConftestRun = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    mockExecutor = createMockExecutor();

    const lib = await import("../../lib");
    vi.mocked(lib.getConfig).mockImplementation(mockGetConfig);

    const aquaMod = await import("../../aqua");
    vi.mocked(aquaMod.NewExecutor).mockImplementation(mockNewExecutor);

    const conftest = await import("../../conftest");
    vi.mocked(conftest.run).mockImplementation(mockConftestRun);

    mockNewExecutor.mockResolvedValue(mockExecutor);
    mockGetConfig.mockResolvedValue({
      git_root_dir: "/git/root",
      renovate_login: "renovate[bot]",
      target_groups: [],
      working_directory_file: ".tfaction.yaml",
      tflint: { enabled: false, fix: false },
      trivy: { enabled: false },
      terraform_command: "terraform",
    });

    vi.mocked(fs.mkdtempSync).mockReturnValue("/tmp/tfaction-main-test");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws error when jobType is undefined", async () => {
    const targetConfig: getTargetConfig.TargetConfig = {
      working_directory: "aws/test",
      target: "aws/test/dev",
      providers_lock_opts: "",
      enable_tflint: false,
      enable_trivy: false,
      tflint_fix: false,
      terraform_command: "terraform",
    };
    const runInputs: RunInputs = {
      githubToken: "test-token",
      jobType: undefined as unknown as string,
    };

    await expect(main(targetConfig, runInputs)).rejects.toThrow(
      "TFACTION_JOB_TYPE is not set",
    );
  });

  it("throws error when jobType is empty string", async () => {
    const targetConfig: getTargetConfig.TargetConfig = {
      working_directory: "aws/test",
      target: "aws/test/dev",
      providers_lock_opts: "",
      enable_tflint: false,
      enable_trivy: false,
      tflint_fix: false,
      terraform_command: "terraform",
    };
    const runInputs: RunInputs = {
      githubToken: "test-token",
      jobType: "",
    };

    await expect(main(targetConfig, runInputs)).rejects.toThrow(
      "TFACTION_JOB_TYPE is not set",
    );
  });

  it("throws error for unknown jobType", async () => {
    const targetConfig: getTargetConfig.TargetConfig = {
      working_directory: "aws/test",
      target: "aws/test/dev",
      providers_lock_opts: "",
      enable_tflint: false,
      enable_trivy: false,
      tflint_fix: false,
      terraform_command: "terraform",
    };
    const runInputs: RunInputs = {
      githubToken: "test-token",
      jobType: "unknown",
    };

    await expect(main(targetConfig, runInputs)).rejects.toThrow(
      "Unknown TFACTION_JOB_TYPE: unknown",
    );
  });

  it("runs terraform plan for terraform job type", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    mockExecutor.getExecOutput
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "",
        stderr: "",
      })
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "{}",
        stderr: "",
      });

    const targetConfig: getTargetConfig.TargetConfig = {
      working_directory: "aws/test",
      target: "aws/test/dev",
      providers_lock_opts: "",
      enable_tflint: false,
      enable_trivy: false,
      tflint_fix: false,
      terraform_command: "terraform",
    };
    const runInputs: RunInputs = {
      githubToken: "test-token",
      jobType: "terraform",
    };

    await main(targetConfig, runInputs);

    expect(mockExecutor.getExecOutput).toHaveBeenCalledWith(
      "tfcmt",
      expect.arrayContaining(["plan", "--"]),
      expect.any(Object),
    );
    expect(mockConftestRun).toHaveBeenCalled();
  });

  it("runs tfmigrate plan for tfmigrate job type when .tfmigrate.hcl exists", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    mockExecutor.exec.mockResolvedValue(0);
    mockExecutor.getExecOutput.mockResolvedValue({
      exitCode: 0,
      stdout: "{}",
      stderr: "",
    });

    const targetConfig: getTargetConfig.TargetConfig = {
      working_directory: "aws/test",
      target: "aws/test/dev",
      providers_lock_opts: "",
      enable_tflint: false,
      enable_trivy: false,
      tflint_fix: false,
      terraform_command: "terraform",
    };
    const runInputs: RunInputs = {
      githubToken: "test-token",
      jobType: "tfmigrate",
    };

    await main(targetConfig, runInputs);

    expect(mockExecutor.exec).toHaveBeenCalledWith(
      "tfmigrate",
      expect.arrayContaining(["plan"]),
      expect.any(Object),
    );
    expect(mockConftestRun).toHaveBeenCalled();
  });

  it("skips conftest when tfmigrate creates .tfmigrate.hcl", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockReturnValue(
      'bucket = "%%S3_BUCKET_NAME_TFMIGRATE_HISTORY%%"',
    );

    const targetConfig: getTargetConfig.TargetConfig = {
      working_directory: "aws/test",
      target: "aws/test/dev",
      providers_lock_opts: "",
      enable_tflint: false,
      enable_trivy: false,
      tflint_fix: false,
      terraform_command: "terraform",
      s3_bucket_name_tfmigrate_history: "my-bucket",
    };
    const runInputs: RunInputs = {
      githubToken: "test-token",
      jobType: "tfmigrate",
    };

    await main(targetConfig, runInputs);

    expect(mockConftestRun).not.toHaveBeenCalled();
  });

  it("uses target config destroy setting", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    mockExecutor.getExecOutput
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "",
        stderr: "",
      })
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "{}",
        stderr: "",
      });

    const targetConfig: getTargetConfig.TargetConfig = {
      working_directory: "aws/test",
      target: "aws/test/dev",
      providers_lock_opts: "",
      enable_tflint: false,
      enable_trivy: false,
      tflint_fix: false,
      terraform_command: "terraform",
      destroy: true,
    };
    const runInputs: RunInputs = {
      githubToken: "test-token",
      jobType: "terraform",
    };

    await main(targetConfig, runInputs);

    expect(mockExecutor.getExecOutput).toHaveBeenCalledWith(
      "tfcmt",
      expect.arrayContaining(["-destroy"]),
      expect.any(Object),
    );
  });

  it("passes driftIssueNumber to runTerraformPlan", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    mockExecutor.getExecOutput
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "",
        stderr: "",
      })
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "{}",
        stderr: "",
      });

    const targetConfig: getTargetConfig.TargetConfig = {
      working_directory: "aws/test",
      target: "aws/test/dev",
      providers_lock_opts: "",
      enable_tflint: false,
      enable_trivy: false,
      tflint_fix: false,
      terraform_command: "terraform",
    };
    const runInputs: RunInputs = {
      githubToken: "test-token",
      jobType: "terraform",
      driftIssueNumber: "789",
    };

    await main(targetConfig, runInputs);

    expect(mockExecutor.getExecOutput).toHaveBeenCalledWith(
      "tfcmt",
      expect.arrayContaining([
        "-config",
        expect.stringContaining("tfcmt-drift.yaml"),
      ]),
      expect.any(Object),
    );
  });

  it("uses target config terraform_command", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    mockExecutor.getExecOutput
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "",
        stderr: "",
      })
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: "{}",
        stderr: "",
      });

    const targetConfig: getTargetConfig.TargetConfig = {
      working_directory: "aws/test",
      target: "aws/test/dev",
      providers_lock_opts: "",
      enable_tflint: false,
      enable_trivy: false,
      tflint_fix: false,
      terraform_command: "tofu",
    };
    const runInputs: RunInputs = {
      githubToken: "test-token",
      jobType: "terraform",
    };

    await main(targetConfig, runInputs);

    expect(mockExecutor.getExecOutput).toHaveBeenCalledWith(
      "tfcmt",
      expect.arrayContaining(["tofu", "plan"]),
      expect.any(Object),
    );
  });
});
