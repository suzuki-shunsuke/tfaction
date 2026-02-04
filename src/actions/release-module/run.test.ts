import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateTag,
  run,
  type RunInput,
  type RunDependencies,
  type Logger,
} from "./run";

describe("generateTag", () => {
  it("generates correct tag from simple path", () => {
    expect(generateTag("foo", "v1.0.0")).toBe("module_foo_v1.0.0");
  });

  it("replaces / with _ in path", () => {
    expect(generateTag("aws/modules/vpc", "v1.0.0")).toBe(
      "module_aws_modules_vpc_v1.0.0",
    );
  });
});

describe("run", () => {
  const createMockLogger = (): Logger => ({
    info: vi.fn(),
  });

  const createMockDeps = (isDirectory: boolean = true): RunDependencies => ({
    createRef: vi.fn().mockResolvedValue({}),
    createRelease: vi.fn().mockResolvedValue({}),
    isDirectory: vi.fn().mockReturnValue(isDirectory),
  });

  const createRunInput = (overrides?: Partial<RunInput>): RunInput => ({
    modulePath: "aws/modules/vpc",
    version: "v1.0.0",
    sha: "abc123",
    serverUrl: "https://github.com",
    repository: "owner/repo",
    owner: "owner",
    repo: "repo",
    logger: createMockLogger(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when modulePath is empty", async () => {
    const input = createRunInput({ modulePath: "" });
    const deps = createMockDeps();

    await expect(run(input, deps)).rejects.toThrow("module_path is required");
  });

  it("throws when version is empty", async () => {
    const input = createRunInput({ version: "" });
    const deps = createMockDeps();

    await expect(run(input, deps)).rejects.toThrow("version is required");
  });

  it("throws when modulePath is not a directory", async () => {
    const input = createRunInput();
    const deps = createMockDeps(false);

    await expect(run(input, deps)).rejects.toThrow(
      "module_path is invalid. aws/modules/vpc isn't found",
    );
  });

  it("calls createRef with correct tag and SHA", async () => {
    const input = createRunInput();
    const deps = createMockDeps();

    await run(input, deps);

    expect(deps.createRef).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      ref: "refs/tags/module_aws_modules_vpc_v1.0.0",
      sha: "abc123",
    });
  });

  it("calls createRelease with correct tag, name, and body", async () => {
    const input = createRunInput();
    const deps = createMockDeps();

    await run(input, deps);

    expect(deps.createRelease).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      tag_name: "module_aws_modules_vpc_v1.0.0",
      name: "module_aws_modules_vpc_v1.0.0",
      body: expect.stringContaining("module: aws/modules/vpc"),
    });
  });

  it("body contains module path, version, source code link, and versions link", async () => {
    const input = createRunInput();
    const deps = createMockDeps();

    await run(input, deps);

    const body = vi.mocked(deps.createRelease).mock.calls[0][0].body;
    expect(body).toContain("module: aws/modules/vpc");
    expect(body).toContain("version: v1.0.0");
    expect(body).toContain(
      "[Source code](https://github.com/owner/repo/tree/module_aws_modules_vpc_v1.0.0/aws/modules/vpc)",
    );
    expect(body).toContain(
      "[Versions](https://github.com/owner/repo/releases?q=aws/modules/vpc)",
    );
  });

  it("logs tag info and completion message", async () => {
    const logger = createMockLogger();
    const input = createRunInput({ logger });
    const deps = createMockDeps();

    await run(input, deps);

    expect(logger.info).toHaveBeenCalledWith(
      "Tag: module_aws_modules_vpc_v1.0.0",
    );
    expect(logger.info).toHaveBeenCalledWith(
      "Creating tag module_aws_modules_vpc_v1.0.0",
    );
    expect(logger.info).toHaveBeenCalledWith(
      "Creating release module_aws_modules_vpc_v1.0.0",
    );
    expect(logger.info).toHaveBeenCalledWith(
      "Released module_aws_modules_vpc_v1.0.0",
    );
  });
});
