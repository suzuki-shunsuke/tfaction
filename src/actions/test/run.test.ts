import { describe, it, expect, vi, beforeEach } from "vitest";
import { run, type RunInput } from "./run";
import type * as aqua from "../../aqua";
import type { TargetConfig } from "../get-target-config";
import type * as types from "../../lib/types";

vi.mock("../../conftest", () => ({
  run: vi.fn(),
}));

vi.mock("./trivy", () => ({
  run: vi.fn(),
}));

vi.mock("./tflint", () => ({
  run: vi.fn(),
}));

vi.mock("../../terraform-docs", () => ({
  run: vi.fn(),
}));

vi.mock("../../commit", () => ({
  create: vi.fn(),
}));

vi.mock("./fmt", () => ({
  fmt: vi.fn(),
}));

const createMockExecutor = () => ({
  exec: vi.fn().mockResolvedValue(0),
  getExecOutput: vi.fn().mockResolvedValue({
    exitCode: 0,
    stdout: "",
    stderr: "",
  }),
  installDir: "/mock/install",
  githubToken: "mock-token",
  env: vi.fn(),
  buildArgs: vi.fn(),
});

type MockExecutor = ReturnType<typeof createMockExecutor>;

const createBaseConfig = (): types.Config =>
  ({
    git_root_dir: "/git/root",
    tflint: { enabled: true, fix: false },
    trivy: { enabled: true },
    target_groups: [],
    working_directory_file: ".tfaction.yaml",
    module_file: "tfaction_module.yaml",
    terraform_command: "terraform",
  }) as unknown as types.Config;

const createBaseTargetConfig = (
  overrides?: Partial<TargetConfig>,
): TargetConfig => ({
  working_directory: "aws/test",
  target: "aws/test/dev",
  providers_lock_opts: "",
  enable_tflint: false,
  enable_trivy: false,
  tflint_fix: false,
  terraform_command: "terraform",
  ...overrides,
});

const createMockFs = () => ({
  existsSync: vi.fn().mockReturnValue(false),
  readFileSync: vi.fn().mockReturnValue(""),
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
});

type MockFs = ReturnType<typeof createMockFs>;

const createRunInput = (
  executor: MockExecutor,
  configOverrides?: Partial<types.Config>,
  targetConfigOverrides?: Partial<TargetConfig>,
  fsOverride?: MockFs,
): RunInput => ({
  config: { ...createBaseConfig(), ...configOverrides } as types.Config,
  targetConfig: createBaseTargetConfig(targetConfigOverrides),
  githubToken: "test-token",
  securefixAppId: "app-id",
  securefixAppPrivateKey: "app-key",
  executor: executor as unknown as aqua.Executor,
  ...(fsOverride ? { fs: fsOverride } : {}),
});

// Helper to get mocked modules
const getMocks = async () => {
  const conftestMod = await import("../../conftest");
  const trivyMod = await import("./trivy");
  const tflintMod = await import("./tflint");
  const terraformDocsMod = await import("../../terraform-docs");
  const commitMod = await import("../../commit");
  const fmtMod = await import("./fmt");
  return {
    conftestMod,
    trivyMod,
    tflintMod,
    terraformDocsMod,
    commitMod,
    fmtMod,
  };
};

describe("run", () => {
  let mockExecutor: MockExecutor;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockExecutor = createMockExecutor();

    const { fmtMod } = await getMocks();
    // Default: fmt returns empty output
    vi.mocked(fmtMod.fmt).mockResolvedValue({
      exitCode: 0,
      stdout: "",
      stderr: "",
    });
  });

  it("conftest runs when destroy=false", async () => {
    const { conftestMod } = await getMocks();
    const input = createRunInput(mockExecutor);
    await run(input);
    expect(conftestMod.run).toHaveBeenCalledOnce();
  });

  it("destroy=true skips conftest, validate, trivy, tflint, fmt, terraform-docs", async () => {
    const { conftestMod, trivyMod, tflintMod, terraformDocsMod, fmtMod } =
      await getMocks();
    const input = createRunInput(mockExecutor, undefined, {
      destroy: true,
      enable_trivy: true,
      enable_tflint: true,
      enable_terraform_docs: true,
    });

    await run(input);

    expect(conftestMod.run).not.toHaveBeenCalled();
    expect(mockExecutor.exec).not.toHaveBeenCalled();
    expect(trivyMod.run).not.toHaveBeenCalled();
    expect(tflintMod.run).not.toHaveBeenCalled();
    expect(fmtMod.fmt).not.toHaveBeenCalled();
    expect(terraformDocsMod.run).not.toHaveBeenCalled();
  });

  it("validate is called with correct args", async () => {
    const input = createRunInput(mockExecutor, undefined, {
      target: "aws/prod/main",
    });

    await run(input);

    expect(mockExecutor.exec).toHaveBeenCalledWith("terraform", ["validate"], {
      cwd: "/git/root/aws/test",
      group: "terraform validate",
      comment: {
        token: "test-token",
        key: "terraform-validate",
        vars: {
          tfaction_target: "aws/prod/main",
        },
      },
    });
  });

  it("validate uses tfCommand from targetConfig", async () => {
    const input = createRunInput(mockExecutor, undefined, {
      terraform_command: "tofu",
    });

    await run(input);

    expect(mockExecutor.exec).toHaveBeenCalledWith(
      "tofu",
      ["validate"],
      expect.objectContaining({
        group: "tofu validate",
      }),
    );
  });

  it("trivy is skipped when enable_trivy=false", async () => {
    const { trivyMod } = await getMocks();
    const input = createRunInput(mockExecutor, undefined, {
      enable_trivy: false,
    });

    await run(input);

    expect(trivyMod.run).not.toHaveBeenCalled();
  });

  it("trivy is called when enabled and not destroy", async () => {
    const { trivyMod } = await getMocks();
    const trivyConfig = { enabled: true };
    const input = createRunInput(
      mockExecutor,
      { trivy: trivyConfig } as Partial<types.Config>,
      { enable_trivy: true },
    );

    await run(input);

    expect(trivyMod.run).toHaveBeenCalledWith({
      workingDirectory: "/git/root/aws/test",
      githubToken: "test-token",
      configPath: "",
      trivy: trivyConfig,
      executor: input.executor,
    });
  });

  it("tflint is skipped when enable_tflint=false", async () => {
    const { tflintMod } = await getMocks();
    const input = createRunInput(mockExecutor, undefined, {
      enable_tflint: false,
    });

    await run(input);

    expect(tflintMod.run).not.toHaveBeenCalled();
  });

  it("tflint is called when enabled and not destroy", async () => {
    const { tflintMod } = await getMocks();
    const tflintConfig = { enabled: true, fix: false };
    const input = createRunInput(
      mockExecutor,
      {
        tflint: tflintConfig,
        securefix_action: {
          server_repository: "owner/repo",
          pull_request: { base_branch: "main" },
        },
      } as Partial<types.Config>,
      { enable_tflint: true, tflint_fix: true },
    );

    await run(input);

    expect(tflintMod.run).toHaveBeenCalledWith({
      workingDirectory: "/git/root/aws/test",
      gitRootDir: "/git/root",
      githubToken: "test-token",
      githubTokenForTflintInit: "",
      githubTokenForFix: "",
      fix: true,
      serverRepository: "owner/repo",
      securefixActionAppId: "app-id",
      securefixActionAppPrivateKey: "app-key",
      executor: input.executor,
      tflint: tflintConfig,
    });
  });

  it("fmt output with files triggers commit", async () => {
    const { fmtMod, commitMod } = await getMocks();
    vi.mocked(fmtMod.fmt).mockResolvedValue({
      exitCode: 0,
      stdout: "main.tf\nvariables.tf\n",
      stderr: "",
    });

    const input = createRunInput(mockExecutor);
    await expect(run(input)).rejects.toThrow(
      "code will be automatically formatted",
    );

    expect(commitMod.create).toHaveBeenCalledWith({
      commitMessage: "style: terraform fmt -recursive",
      githubToken: "test-token",
      files: new Set(["aws/test/main.tf", "aws/test/variables.tf"]),
      serverRepository: "",
      appId: "app-id",
      appPrivateKey: "app-key",
    });
  });

  it("fmt output empty does not trigger commit", async () => {
    const { fmtMod, commitMod } = await getMocks();
    vi.mocked(fmtMod.fmt).mockResolvedValue({
      exitCode: 0,
      stdout: "",
      stderr: "",
    });

    const input = createRunInput(mockExecutor);
    await run(input);

    expect(commitMod.create).not.toHaveBeenCalled();
  });

  it("fmt output with whitespace-only lines does not trigger commit", async () => {
    const { fmtMod, commitMod } = await getMocks();
    vi.mocked(fmtMod.fmt).mockResolvedValue({
      exitCode: 0,
      stdout: "  \n  \n  ",
      stderr: "",
    });

    const input = createRunInput(mockExecutor);
    await run(input);

    expect(commitMod.create).not.toHaveBeenCalled();
  });

  it("fmt files are prefixed with workingDir", async () => {
    const { fmtMod, commitMod } = await getMocks();
    vi.mocked(fmtMod.fmt).mockResolvedValue({
      exitCode: 0,
      stdout: "outputs.tf\n",
      stderr: "",
    });

    const input = createRunInput(mockExecutor, undefined, {
      working_directory: "gcp/staging",
    });
    await expect(run(input)).rejects.toThrow(
      "code will be automatically formatted",
    );

    expect(commitMod.create).toHaveBeenCalledWith(
      expect.objectContaining({
        files: new Set(["gcp/staging/outputs.tf"]),
      }),
    );
  });

  it("commit message includes tfCommand", async () => {
    const { fmtMod, commitMod } = await getMocks();
    vi.mocked(fmtMod.fmt).mockResolvedValue({
      exitCode: 0,
      stdout: "main.tf\n",
      stderr: "",
    });

    const input = createRunInput(mockExecutor, undefined, {
      terraform_command: "tofu",
    });
    await expect(run(input)).rejects.toThrow(
      "code will be automatically formatted",
    );

    expect(commitMod.create).toHaveBeenCalledWith(
      expect.objectContaining({
        commitMessage: "style: tofu fmt -recursive",
      }),
    );
  });

  it("terraform-docs is skipped when enable_terraform_docs=false", async () => {
    const { terraformDocsMod } = await getMocks();
    const input = createRunInput(mockExecutor, undefined, {
      enable_terraform_docs: false,
    });

    await run(input);

    expect(terraformDocsMod.run).not.toHaveBeenCalled();
  });

  it("terraform-docs is called when enabled and not destroy", async () => {
    const { terraformDocsMod } = await getMocks();
    const input = createRunInput(
      mockExecutor,
      {
        securefix_action: {
          server_repository: "owner/server",
          pull_request: { base_branch: "main" },
        },
      } as Partial<types.Config>,
      { enable_terraform_docs: true },
    );

    await run(input);

    expect(terraformDocsMod.run).toHaveBeenCalledWith({
      workingDirectory: "/git/root/aws/test",
      githubToken: "test-token",
      securefixActionAppId: "app-id",
      securefixActionAppPrivateKey: "app-key",
      securefixActionServerRepository: "owner/server",
      executor: input.executor,
      repoRoot: "/git/root",
    });
  });

  it("serverRepository defaults to empty when securefix_action is undefined", async () => {
    const { fmtMod, commitMod } = await getMocks();
    vi.mocked(fmtMod.fmt).mockResolvedValue({
      exitCode: 0,
      stdout: "main.tf\n",
      stderr: "",
    });

    const input = createRunInput(mockExecutor);
    await expect(run(input)).rejects.toThrow(
      "code will be automatically formatted",
    );

    expect(commitMod.create).toHaveBeenCalledWith(
      expect.objectContaining({
        serverRepository: "",
      }),
    );
  });

  it("all tools run in correct order when everything is enabled and not destroy", async () => {
    const {
      conftestMod,
      trivyMod,
      tflintMod,
      terraformDocsMod,
      commitMod,
      fmtMod,
    } = await getMocks();

    const callOrder: string[] = [];
    vi.mocked(conftestMod.run).mockImplementation(() => {
      callOrder.push("conftest");
      return Promise.resolve();
    });
    mockExecutor.exec.mockImplementation(() => {
      callOrder.push("validate");
      return Promise.resolve(0);
    });
    vi.mocked(trivyMod.run).mockImplementation(() => {
      callOrder.push("trivy");
      return Promise.resolve();
    });
    vi.mocked(tflintMod.run).mockImplementation(() => {
      callOrder.push("tflint");
      return Promise.resolve();
    });
    vi.mocked(fmtMod.fmt).mockImplementation(() => {
      callOrder.push("fmt");
      return Promise.resolve({ exitCode: 0, stdout: "main.tf\n", stderr: "" });
    });
    vi.mocked(commitMod.create).mockImplementation(() => {
      callOrder.push("commit");
      return Promise.resolve("");
    });
    vi.mocked(terraformDocsMod.run).mockImplementation(() => {
      callOrder.push("terraform-docs");
      return Promise.resolve();
    });

    const input = createRunInput(mockExecutor, undefined, {
      enable_trivy: true,
      enable_tflint: true,
      enable_terraform_docs: true,
    });

    await expect(run(input)).rejects.toThrow(
      "code will be automatically formatted",
    );

    expect(callOrder).toEqual([
      "conftest",
      "validate",
      "trivy",
      "tflint",
      "fmt",
      "commit",
    ]);
  });

  it("workingDir is computed as path.join(git_root_dir, working_directory)", async () => {
    const input = createRunInput(
      mockExecutor,
      { git_root_dir: "/my/repo" } as Partial<types.Config>,
      { working_directory: "infra/prod" },
    );

    await run(input);

    expect(mockExecutor.exec).toHaveBeenCalledWith(
      "terraform",
      ["validate"],
      expect.objectContaining({
        cwd: "/my/repo/infra/prod",
      }),
    );
  });

  describe("type=module", () => {
    it("runs terraform init", async () => {
      const mockFs = createMockFs();
      const input = createRunInput(
        mockExecutor,
        undefined,
        { type: "module" },
        mockFs,
      );
      await run(input);

      expect(mockExecutor.exec).toHaveBeenCalledWith(
        "terraform",
        ["init"],
        expect.objectContaining({
          cwd: "/git/root/aws/test",
          group: "terraform init",
        }),
      );
    });

    it("skips conftest and validate", async () => {
      const { conftestMod } = await getMocks();
      const mockFs = createMockFs();
      const input = createRunInput(
        mockExecutor,
        undefined,
        { type: "module" },
        mockFs,
      );
      await run(input);

      expect(conftestMod.run).not.toHaveBeenCalled();
      // validate is not called - only init is called via executor.exec
      expect(mockExecutor.exec).not.toHaveBeenCalledWith(
        "terraform",
        ["validate"],
        expect.anything(),
      );
    });

    it("deletes lock file created by terraform init", async () => {
      const mockFs = createMockFs();
      // Lock file does not exist before init
      mockFs.existsSync.mockImplementation((p: string) => {
        if (p === "/git/root/aws/test/.terraform.lock.hcl") {
          // First call (before init): false, second call (after tools): true
          return (
            mockFs.existsSync.mock.calls.filter((c: string[]) => c[0] === p)
              .length > 1
          );
        }
        return false;
      });

      const input = createRunInput(
        mockExecutor,
        undefined,
        { type: "module" },
        mockFs,
      );
      await run(input);

      expect(mockFs.unlinkSync).toHaveBeenCalledWith(
        "/git/root/aws/test/.terraform.lock.hcl",
      );
    });

    it("reverts lock file modified by terraform init", async () => {
      const mockFs = createMockFs();
      const originalContent = "original lock content";
      const modifiedContent = "modified lock content";

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        // First call: save original, second call: read current (modified)
        return mockFs.readFileSync.mock.calls.length <= 1
          ? originalContent
          : modifiedContent;
      });

      const input = createRunInput(
        mockExecutor,
        undefined,
        { type: "module" },
        mockFs,
      );
      await run(input);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        "/git/root/aws/test/.terraform.lock.hcl",
        originalContent,
      );
    });

    it("does nothing when lock file is unchanged", async () => {
      const mockFs = createMockFs();
      const content = "unchanged lock content";

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(content);

      const input = createRunInput(
        mockExecutor,
        undefined,
        { type: "module" },
        mockFs,
      );
      await run(input);

      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
      expect(mockFs.unlinkSync).not.toHaveBeenCalled();
    });

    it("fmt commits without throwing", async () => {
      const { fmtMod, commitMod } = await getMocks();
      vi.mocked(fmtMod.fmt).mockResolvedValue({
        exitCode: 0,
        stdout: "main.tf\n",
        stderr: "",
      });

      const mockFs = createMockFs();
      const input = createRunInput(
        mockExecutor,
        undefined,
        { type: "module" },
        mockFs,
      );

      // Should not throw for modules
      await expect(run(input)).resolves.toBeUndefined();
      expect(commitMod.create).toHaveBeenCalledWith(
        expect.objectContaining({
          commitMessage: "style: terraform fmt -recursive",
        }),
      );
    });

    it("runs all module tools in correct order", async () => {
      const { trivyMod, tflintMod, terraformDocsMod, fmtMod, conftestMod } =
        await getMocks();

      const callOrder: string[] = [];
      mockExecutor.exec.mockImplementation((cmd: string, args: string[]) => {
        if (args[0] === "init") {
          callOrder.push("init");
        }
        return Promise.resolve(0);
      });
      vi.mocked(conftestMod.run).mockImplementation(() => {
        callOrder.push("conftest");
        return Promise.resolve();
      });
      vi.mocked(trivyMod.run).mockImplementation(() => {
        callOrder.push("trivy");
        return Promise.resolve();
      });
      vi.mocked(tflintMod.run).mockImplementation(() => {
        callOrder.push("tflint");
        return Promise.resolve();
      });
      vi.mocked(fmtMod.fmt).mockImplementation(() => {
        callOrder.push("fmt");
        return Promise.resolve({ exitCode: 0, stdout: "", stderr: "" });
      });
      vi.mocked(terraformDocsMod.run).mockImplementation(() => {
        callOrder.push("terraform-docs");
        return Promise.resolve();
      });

      const mockFs = createMockFs();
      const input = createRunInput(
        mockExecutor,
        undefined,
        {
          type: "module",
          enable_trivy: true,
          enable_tflint: true,
          enable_terraform_docs: true,
        },
        mockFs,
      );
      await run(input);

      expect(callOrder).toEqual([
        "init",
        "trivy",
        "tflint",
        "fmt",
        "terraform-docs",
      ]);
      // conftest should not be called for modules
      expect(conftestMod.run).not.toHaveBeenCalled();
    });
  });
});
