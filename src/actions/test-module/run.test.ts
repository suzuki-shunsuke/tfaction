import { describe, it, expect, vi, beforeEach } from "vitest";
import * as path from "path";
import { run, type RunInput } from "./run";
import type * as aqua from "../../aqua";
import type * as types from "../../lib/types";

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
    workspace: "/git/root",
    tflint: { enabled: true, fix: false },
    trivy: { enabled: true },
    target_groups: [],
    working_directory_file: ".tfaction.yaml",
    terraform_command: "terraform",
  }) as unknown as types.Config;

const createMockFs = () => ({
  existsSync: vi.fn().mockReturnValue(false),
  unlinkSync: vi.fn(),
});

const createMockLogger = () => ({
  info: vi.fn(),
});

const createRunInput = (
  executor: MockExecutor,
  overrides?: {
    config?: Partial<types.Config>;
    target?: string;
    workingDir?: string;
    fs?: ReturnType<typeof createMockFs>;
    logger?: ReturnType<typeof createMockLogger>;
  },
): RunInput => ({
  config: {
    ...createBaseConfig(),
    ...overrides?.config,
  } as types.Config,
  target: overrides?.target ?? "aws/test",
  workingDir: overrides?.workingDir ?? "/git/root/aws/test",
  githubToken: "test-token",
  securefixAppId: "app-id",
  securefixAppPrivateKey: "app-key",
  executor: executor as unknown as aqua.Executor,
  fs: overrides?.fs ?? createMockFs(),
  logger: overrides?.logger ?? createMockLogger(),
});

// Helper to get mocked modules
const getMocks = async () => {
  const trivyMod = await import("../../trivy");
  const tflintMod = await import("../../tflint");
  const terraformDocsMod = await import("../../terraform-docs");
  const commitMod = await import("../../commit");
  return {
    trivyMod,
    tflintMod,
    terraformDocsMod,
    commitMod,
  };
};

describe("run", () => {
  let mockExecutor: MockExecutor;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecutor = createMockExecutor();
  });

  it("terraform init is called with correct args", async () => {
    const input = createRunInput(mockExecutor, { target: "aws/prod/main" });
    await run(input);

    expect(mockExecutor.exec).toHaveBeenCalledWith("terraform", ["init"], {
      cwd: "/git/root/aws/test",
      group: "terraform init",
      comment: {
        token: "test-token",
        vars: {
          tfaction_target: "aws/prod/main",
        },
      },
    });
  });

  it("terraform init uses terraformCommand from config", async () => {
    const input = createRunInput(mockExecutor, {
      config: { terraform_command: "tofu" },
    });
    await run(input);

    expect(mockExecutor.exec).toHaveBeenCalledWith(
      "tofu",
      ["init"],
      expect.objectContaining({
        group: "tofu init",
      }),
    );
  });

  it("trivy is called when enabled", async () => {
    const { trivyMod } = await getMocks();
    const trivyConfig = { enabled: true };
    const input = createRunInput(mockExecutor, {
      config: { trivy: trivyConfig } as Partial<types.Config>,
    });
    await run(input);

    expect(trivyMod.run).toHaveBeenCalledWith({
      workingDirectory: "/git/root/aws/test",
      githubToken: "test-token",
      configPath: "",
      trivy: trivyConfig,
      executor: input.executor,
    });
  });

  it("trivy is skipped when config.trivy.enabled=false", async () => {
    const { trivyMod } = await getMocks();
    const input = createRunInput(mockExecutor, {
      config: { trivy: { enabled: false } } as Partial<types.Config>,
    });
    await run(input);

    expect(trivyMod.run).not.toHaveBeenCalled();
  });

  it("trivy defaults to enabled when config.trivy is undefined", async () => {
    const { trivyMod } = await getMocks();
    const input = createRunInput(mockExecutor, {
      config: { trivy: undefined } as Partial<types.Config>,
    });
    await run(input);

    expect(trivyMod.run).toHaveBeenCalled();
  });

  it("tflint is called when enabled", async () => {
    const { tflintMod } = await getMocks();
    const tflintConfig = { enabled: true, fix: true };
    const input = createRunInput(mockExecutor, {
      config: {
        tflint: tflintConfig,
        securefix_action: {
          server_repository: "owner/repo",
          pull_request: { base_branch: "main" },
        },
      } as Partial<types.Config>,
    });
    await run(input);

    expect(tflintMod.run).toHaveBeenCalledWith({
      workingDirectory: "/git/root/aws/test",
      githubToken: "test-token",
      githubTokenForTflintInit: "test-token",
      githubTokenForFix: "test-token",
      fix: true,
      serverRepository: "owner/repo",
      securefixActionAppId: "app-id",
      securefixActionAppPrivateKey: "app-key",
      executor: input.executor,
      tflint: tflintConfig,
    });
  });

  it("tflint is skipped when config.tflint.enabled=false", async () => {
    const { tflintMod } = await getMocks();
    const input = createRunInput(mockExecutor, {
      config: {
        tflint: { enabled: false, fix: false },
      } as Partial<types.Config>,
    });
    await run(input);

    expect(tflintMod.run).not.toHaveBeenCalled();
  });

  it("tflint defaults to enabled when config.tflint is undefined", async () => {
    const { tflintMod } = await getMocks();
    const input = createRunInput(mockExecutor, {
      config: { tflint: undefined } as Partial<types.Config>,
    });
    await run(input);

    expect(tflintMod.run).toHaveBeenCalled();
  });

  it("lock file is removed when it exists", async () => {
    const mockFs = createMockFs();
    mockFs.existsSync.mockReturnValue(true);
    const input = createRunInput(mockExecutor, { fs: mockFs });
    await run(input);

    expect(mockFs.unlinkSync).toHaveBeenCalledWith(
      path.join("aws/test", ".terraform.lock.hcl"),
    );
  });

  it("lock file removal is skipped when it does not exist", async () => {
    const mockFs = createMockFs();
    mockFs.existsSync.mockReturnValue(false);
    const input = createRunInput(mockExecutor, { fs: mockFs });
    await run(input);

    expect(mockFs.unlinkSync).not.toHaveBeenCalled();
  });

  it("terraform-docs is always called", async () => {
    const { terraformDocsMod } = await getMocks();
    const input = createRunInput(mockExecutor);
    await run(input);

    expect(terraformDocsMod.run).toHaveBeenCalledWith({
      workingDirectory: "/git/root/aws/test",
      githubToken: "test-token",
      securefixActionAppId: "app-id",
      securefixActionAppPrivateKey: "app-key",
      securefixActionServerRepository: "",
      executor: input.executor,
      repoRoot: "/git/root",
    });
  });

  it("fmt output with files triggers commit", async () => {
    const { commitMod } = await getMocks();
    // Simulate fmt producing output via the listeners.stdout callback
    mockExecutor.exec.mockImplementation(
      async (
        cmd: string,
        args: string[],
        options?: { listeners?: { stdout?: (data: Buffer) => void } },
      ) => {
        if (args[0] === "fmt") {
          options?.listeners?.stdout?.(Buffer.from("main.tf\nvariables.tf\n"));
        }
        return 0;
      },
    );

    const input = createRunInput(mockExecutor);
    await run(input);

    expect(commitMod.create).toHaveBeenCalledWith({
      commitMessage: "style: terraform fmt -recursive",
      githubToken: "test-token",
      rootDir: "/git/root",
      files: new Set([
        "git/root/aws/test/main.tf",
        "git/root/aws/test/variables.tf",
      ]),
      serverRepository: "",
      appId: "app-id",
      appPrivateKey: "app-key",
    });
  });

  it("fmt output empty does not trigger commit", async () => {
    const { commitMod } = await getMocks();
    const input = createRunInput(mockExecutor);
    await run(input);

    expect(commitMod.create).not.toHaveBeenCalled();
  });

  it("commit message includes terraformCommand", async () => {
    const { commitMod } = await getMocks();
    mockExecutor.exec.mockImplementation(
      async (
        cmd: string,
        args: string[],
        options?: { listeners?: { stdout?: (data: Buffer) => void } },
      ) => {
        if (args[0] === "fmt") {
          options?.listeners?.stdout?.(Buffer.from("main.tf\n"));
        }
        return 0;
      },
    );

    const input = createRunInput(mockExecutor, {
      config: { terraform_command: "tofu" },
    });
    await run(input);

    expect(commitMod.create).toHaveBeenCalledWith(
      expect.objectContaining({
        commitMessage: "style: tofu fmt -recursive",
      }),
    );
  });

  it("all tools run in correct order", async () => {
    const { trivyMod, tflintMod, terraformDocsMod, commitMod } =
      await getMocks();

    const callOrder: string[] = [];
    mockExecutor.exec.mockImplementation(
      async (
        cmd: string,
        args: string[],
        options?: { listeners?: { stdout?: (data: Buffer) => void } },
      ) => {
        if (args[0] === "init") {
          callOrder.push("init");
        } else if (args[0] === "fmt") {
          callOrder.push("fmt");
          options?.listeners?.stdout?.(Buffer.from("main.tf\n"));
        }
        return 0;
      },
    );
    vi.mocked(trivyMod.run).mockImplementation(async () => {
      callOrder.push("trivy");
    });
    vi.mocked(tflintMod.run).mockImplementation(async () => {
      callOrder.push("tflint");
    });
    vi.mocked(terraformDocsMod.run).mockImplementation(async () => {
      callOrder.push("terraform-docs");
    });
    vi.mocked(commitMod.create).mockImplementation(async () => {
      callOrder.push("commit");
      return "";
    });

    const mockFs = createMockFs();
    mockFs.existsSync.mockReturnValue(true);
    const input = createRunInput(mockExecutor, { fs: mockFs });
    await run(input);

    expect(callOrder).toEqual([
      "init",
      "trivy",
      "tflint",
      "terraform-docs",
      "fmt",
      "commit",
    ]);
  });

  it("workingDirFromGitRoot is computed correctly", async () => {
    const { commitMod } = await getMocks();
    mockExecutor.exec.mockImplementation(
      async (
        cmd: string,
        args: string[],
        options?: { listeners?: { stdout?: (data: Buffer) => void } },
      ) => {
        if (args[0] === "fmt") {
          options?.listeners?.stdout?.(Buffer.from("outputs.tf\n"));
        }
        return 0;
      },
    );

    const input = createRunInput(mockExecutor, {
      config: {
        git_root_dir: "/my/repo",
        workspace: "/my/repo",
      } as Partial<types.Config>,
      workingDir: "/my/repo/infra/prod",
    });
    await run(input);

    expect(commitMod.create).toHaveBeenCalledWith(
      expect.objectContaining({
        files: new Set(["my/repo/infra/prod/outputs.tf"]),
      }),
    );
  });
});
