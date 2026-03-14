import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateProviders, checkProviders } from "./check-providers";
import type { CheckProvidersInput } from "./check-providers";

vi.mock("@actions/github", () => ({
  getOctokit: vi.fn().mockReturnValue({
    rest: {
      issues: {
        createComment: vi.fn(),
      },
    },
  }),
  context: {
    repo: { owner: "owner", repo: "repo" },
    job: "test",
    sha: "abc123",
    runId: 1,
    serverUrl: "https://github.com",
  },
}));

vi.mock("../../comment", () => ({
  post: vi.fn(),
}));

describe("validateProviders", () => {
  it("returns empty array when provider_selections is empty", () => {
    const result = validateProviders({}, [
      { name: "registry.terraform.io/hashicorp/aws" },
    ]);
    expect(result).toEqual([]);
  });

  it("returns empty array when all providers are in allowlist", () => {
    const result = validateProviders(
      {
        "registry.terraform.io/hashicorp/aws": "5.0.0",
        "registry.terraform.io/hashicorp/google": "4.0.0",
      },
      [
        { name: "registry.terraform.io/hashicorp/aws" },
        { name: "registry.terraform.io/hashicorp/google" },
      ],
    );
    expect(result).toEqual([]);
  });

  it("returns disallowed provider", () => {
    const result = validateProviders(
      {
        "registry.terraform.io/hashicorp/aws": "5.0.0",
        "registry.terraform.io/hashicorp/random": "3.0.0",
      },
      [{ name: "registry.terraform.io/hashicorp/aws" }],
    );
    expect(result).toEqual(["registry.terraform.io/hashicorp/random"]);
  });

  it("returns all providers when allowlist is empty", () => {
    const result = validateProviders(
      {
        "registry.terraform.io/hashicorp/aws": "5.0.0",
        "registry.terraform.io/hashicorp/google": "4.0.0",
      },
      [],
    );
    expect(result).toEqual([
      "registry.terraform.io/hashicorp/aws",
      "registry.terraform.io/hashicorp/google",
    ]);
  });

  it("returns only disallowed providers from a mix", () => {
    const result = validateProviders(
      {
        "registry.terraform.io/hashicorp/aws": "5.0.0",
        "registry.terraform.io/hashicorp/google": "4.0.0",
        "registry.terraform.io/hashicorp/random": "3.0.0",
      },
      [
        { name: "registry.terraform.io/hashicorp/aws" },
        { name: "registry.terraform.io/hashicorp/google" },
      ],
    );
    expect(result).toEqual(["registry.terraform.io/hashicorp/random"]);
  });
});

describe("checkProviders", () => {
  let mockPost: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const commentMod = await import("../../comment");
    mockPost = vi.mocked(commentMod.post);
  });

  const createInput = (
    overrides?: Partial<CheckProvidersInput>,
  ): CheckProvidersInput => ({
    executor: {
      getExecOutput: vi.fn().mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify({
          provider_selections: {},
        }),
        stderr: "",
      }),
    } as unknown as CheckProvidersInput["executor"],
    tfCommand: "terraform",
    workingDir: "/work",
    availableProviders: [],
    target: "aws/test/dev",
    githubToken: "token",
    prNumber: 1,
    terragruntRunAvailable: false,
    ...overrides,
  });

  it("throws on disallowed provider and posts comment", async () => {
    const input = createInput({
      executor: {
        getExecOutput: vi.fn().mockResolvedValue({
          exitCode: 0,
          stdout: JSON.stringify({
            provider_selections: {
              "registry.terraform.io/hashicorp/aws": "5.0.0",
            },
          }),
          stderr: "",
        }),
      } as unknown as CheckProvidersInput["executor"],
      availableProviders: [],
    });

    await expect(checkProviders(input)).rejects.toThrow(
      "Disallowed providers: registry.terraform.io/hashicorp/aws",
    );
    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({
        templateKey: "disallowed-provider",
        vars: {
          tfaction_target: "aws/test/dev",
          disallowed_providers: ["registry.terraform.io/hashicorp/aws"],
        },
      }),
    );
  });

  it("passes when all providers are allowed", async () => {
    const input = createInput({
      executor: {
        getExecOutput: vi.fn().mockResolvedValue({
          exitCode: 0,
          stdout: JSON.stringify({
            provider_selections: {
              "registry.terraform.io/hashicorp/aws": "5.0.0",
            },
          }),
          stderr: "",
        }),
      } as unknown as CheckProvidersInput["executor"],
      availableProviders: [{ name: "registry.terraform.io/hashicorp/aws" }],
    });

    await expect(checkProviders(input)).resolves.toBeUndefined();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("handles empty provider_selections", async () => {
    const input = createInput();
    await expect(checkProviders(input)).resolves.toBeUndefined();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("uses 'run -- version -json' when terragruntRunAvailable is true", async () => {
    const mockGetExecOutput = vi.fn().mockResolvedValue({
      exitCode: 0,
      stdout: JSON.stringify({ provider_selections: {} }),
      stderr: "",
    });
    const input = createInput({
      executor: {
        getExecOutput: mockGetExecOutput,
      } as unknown as CheckProvidersInput["executor"],
      tfCommand: "terragrunt",
      terragruntRunAvailable: true,
    });

    await checkProviders(input);
    expect(mockGetExecOutput).toHaveBeenCalledWith(
      "terragrunt",
      ["run", "--", "version", "-json"],
      { cwd: "/work" },
    );
  });

  it("uses 'version -json' when terragruntRunAvailable is false", async () => {
    const mockGetExecOutput = vi.fn().mockResolvedValue({
      exitCode: 0,
      stdout: JSON.stringify({ provider_selections: {} }),
      stderr: "",
    });
    const input = createInput({
      executor: {
        getExecOutput: mockGetExecOutput,
      } as unknown as CheckProvidersInput["executor"],
      tfCommand: "terragrunt",
      terragruntRunAvailable: false,
    });

    await checkProviders(input);
    expect(mockGetExecOutput).toHaveBeenCalledWith(
      "terragrunt",
      ["version", "-json"],
      { cwd: "/work" },
    );
  });

  it("does not post comment when prNumber is 0", async () => {
    const input = createInput({
      executor: {
        getExecOutput: vi.fn().mockResolvedValue({
          exitCode: 0,
          stdout: JSON.stringify({
            provider_selections: {
              "registry.terraform.io/hashicorp/aws": "5.0.0",
            },
          }),
          stderr: "",
        }),
      } as unknown as CheckProvidersInput["executor"],
      availableProviders: [],
      prNumber: 0,
    });

    await expect(checkProviders(input)).rejects.toThrow(
      "Disallowed providers: registry.terraform.io/hashicorp/aws",
    );
    expect(mockPost).not.toHaveBeenCalled();
  });
});
