import { describe, it, expect, vi, beforeEach } from "vitest";
import { run, type RunInput } from "./run";
import type * as aqua from "../../aqua";
import type { TargetConfig } from "../get-target-config";
import type * as types from "../../lib/types";

vi.mock("../../conftest", () => ({
  run: vi.fn(),
}));

vi.mock("../../trivy", () => ({
  run: vi.fn(),
}));

vi.mock("../../tflint", () => ({
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

const createRunInput = (
  executor: MockExecutor,
  configOverrides?: Partial<types.Config>,
  targetConfigOverrides?: Partial<TargetConfig>,
): RunInput => ({
  config: { ...createBaseConfig(), ...configOverrides } as types.Config,
  targetConfig: createBaseTargetConfig(targetConfigOverrides),
  githubToken: "test-token",
  securefixAppId: "app-id",
  securefixAppPrivateKey: "app-key",
  executor: executor as unknown as aqua.Executor,
});

// Helper to get mocked modules
const getMocks = async () => {
  const conftestMod = await import("../../conftest");
  const trivyMod = await import("../../trivy");
  const tflintMod = await import("../../tflint");
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

  it("conftest always runs", async () => {
    const { conftestMod } = await getMocks();
    const input = createRunInput(mockExecutor);
    await run(input);
    expect(conftestMod.run).toHaveBeenCalledOnce();
  });

  it("destroy=true skips validate, trivy, tflint, fmt, terraform-docs", async () => {
    const { conftestMod, trivyMod, tflintMod, terraformDocsMod, fmtMod } =
      await getMocks();
    const input = createRunInput(mockExecutor, undefined, {
      destroy: true,
      enable_trivy: true,
      enable_tflint: true,
      enable_terraform_docs: true,
    });

    await run(input);

    expect(conftestMod.run).toHaveBeenCalledOnce();
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
    await run(input);

    expect(commitMod.create).toHaveBeenCalledWith({
      commitMessage: "style: terraform fmt -recursive",
      githubToken: "test-token",
      files: new Set([
        "/git/root/aws/test/main.tf",
        "/git/root/aws/test/variables.tf",
      ]),
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
    await run(input);

    expect(commitMod.create).toHaveBeenCalledWith(
      expect.objectContaining({
        files: new Set(["/git/root/gcp/staging/outputs.tf"]),
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
    await run(input);

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
    await run(input);

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
    vi.mocked(conftestMod.run).mockImplementation(async () => {
      callOrder.push("conftest");
    });
    mockExecutor.exec.mockImplementation(async () => {
      callOrder.push("validate");
      return 0;
    });
    vi.mocked(trivyMod.run).mockImplementation(async () => {
      callOrder.push("trivy");
    });
    vi.mocked(tflintMod.run).mockImplementation(async () => {
      callOrder.push("tflint");
    });
    vi.mocked(fmtMod.fmt).mockImplementation(async () => {
      callOrder.push("fmt");
      return { exitCode: 0, stdout: "main.tf\n", stderr: "" };
    });
    vi.mocked(commitMod.create).mockImplementation(async () => {
      callOrder.push("commit");
      return "";
    });
    vi.mocked(terraformDocsMod.run).mockImplementation(async () => {
      callOrder.push("terraform-docs");
    });

    const input = createRunInput(mockExecutor, undefined, {
      enable_trivy: true,
      enable_tflint: true,
      enable_terraform_docs: true,
    });

    await run(input);

    expect(callOrder).toEqual([
      "conftest",
      "validate",
      "trivy",
      "tflint",
      "fmt",
      "commit",
      "terraform-docs",
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
});
