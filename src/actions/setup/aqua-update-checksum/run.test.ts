import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@actions/core", () => ({
  info: vi.fn(),
}));

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  return {
    ...actual,
    existsSync: vi.fn(),
  };
});

vi.mock("../../../lib/git", () => ({
  isFileTracked: vi.fn(),
  hasFileChanged: vi.fn(),
}));

vi.mock("../../../commit", () => ({
  create: vi.fn(),
}));

import * as fs from "fs";

import * as aqua from "../../../aqua";
import * as types from "../../../lib/types";
import * as git from "../../../lib/git";
import * as commit from "../../../commit";

import {
  runAquaUpdateChecksum,
  findChecksumFile,
  checkIfChanged,
  main,
} from "./run";

const createMockExecutor = () =>
  ({ exec: vi.fn().mockResolvedValue(undefined) }) as unknown as aqua.Executor;

describe("runAquaUpdateChecksum", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls aqua update-checksum without -prune when prune is false", async () => {
    const executor = createMockExecutor();
    await runAquaUpdateChecksum(executor, "/workspace/dir", false);

    expect(executor.exec).toHaveBeenCalledWith("aqua", ["update-checksum"], {
      cwd: "/workspace/dir",
    });
  });

  it("calls aqua update-checksum -prune when prune is true", async () => {
    const executor = createMockExecutor();
    await runAquaUpdateChecksum(executor, "/workspace/dir", true);

    expect(executor.exec).toHaveBeenCalledWith(
      "aqua",
      ["update-checksum", "-prune"],
      { cwd: "/workspace/dir" },
    );
  });
});

describe("findChecksumFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the first matching candidate when it exists", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);

    const result = findChecksumFile("/workspace");

    expect(result).toBe("aqua-checksums.json");
  });

  it("returns empty string when no candidate exists", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = findChecksumFile("/workspace");

    expect(result).toBe("");
  });

  it("checks candidates in priority order", () => {
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(false) // aqua-checksums.json
      .mockReturnValueOnce(false) // .aqua-checksums.json
      .mockReturnValueOnce(true); // aqua/aqua-checksums.json

    const result = findChecksumFile("/workspace");

    expect(result).toBe("aqua/aqua-checksums.json");
  });
});

describe("checkIfChanged", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when the file is not tracked (new file)", async () => {
    vi.mocked(git.isFileTracked).mockResolvedValue(false);

    const result = await checkIfChanged("aqua-checksums.json", "/workspace");

    expect(result).toBe(true);
    expect(git.hasFileChanged).not.toHaveBeenCalled();
  });

  it("returns result of hasFileChanged when file is tracked", async () => {
    vi.mocked(git.isFileTracked).mockResolvedValue(true);
    vi.mocked(git.hasFileChanged).mockResolvedValue(true);

    const result = await checkIfChanged("aqua-checksums.json", "/workspace");

    expect(result).toBe(true);
    expect(git.hasFileChanged).toHaveBeenCalledWith(
      "aqua-checksums.json",
      "/workspace",
    );
  });

  it("returns false when file is tracked and has not changed", async () => {
    vi.mocked(git.isFileTracked).mockResolvedValue(true);
    vi.mocked(git.hasFileChanged).mockResolvedValue(false);

    const result = await checkIfChanged("aqua-checksums.json", "/workspace");

    expect(result).toBe(false);
  });
});

describe("main", () => {
  const defaultInputs = {
    githubToken: "token",
    securefixActionAppId: "app-id",
    securefixActionAppPrivateKey: "app-key",
  };

  const defaultCfg = {
    git_root_dir: "/repo",
    workspace: "/repo",
    aqua: {
      update_checksum: {
        prune: false,
        skip_push: false,
      },
    },
    securefix_action: {
      server_repository: "owner/repo",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs aqua update-checksum with prune from config", async () => {
    const executor = createMockExecutor();
    vi.mocked(fs.existsSync).mockReturnValue(false);

    await main(
      executor,
      "working-dir",
      {
        ...defaultCfg,
        aqua: { update_checksum: { prune: true, skip_push: false } },
      } as unknown as types.Config,
      defaultInputs,
    );

    expect(executor.exec).toHaveBeenCalledWith(
      "aqua",
      ["update-checksum", "-prune"],
      { cwd: "working-dir" },
    );
  });

  it("returns early when no checksum file is found", async () => {
    const executor = createMockExecutor();
    vi.mocked(fs.existsSync).mockReturnValue(false);

    await main(
      executor,
      "working-dir",
      defaultCfg as unknown as types.Config,
      defaultInputs,
    );

    expect(git.isFileTracked).not.toHaveBeenCalled();
    expect(commit.create).not.toHaveBeenCalled();
  });

  it("returns early when checksum file has not changed", async () => {
    const executor = createMockExecutor();
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(git.isFileTracked).mockResolvedValue(true);
    vi.mocked(git.hasFileChanged).mockResolvedValue(false);

    await main(
      executor,
      "working-dir",
      defaultCfg as unknown as types.Config,
      defaultInputs,
    );

    expect(commit.create).not.toHaveBeenCalled();
  });

  it("throws error with 'isn't latest' when skip_push is true and file changed", async () => {
    const executor = createMockExecutor();
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(git.isFileTracked).mockResolvedValue(false);

    const cfg = {
      ...defaultCfg,
      aqua: { update_checksum: { prune: false, skip_push: true } },
    };

    await expect(
      main(
        executor,
        "working-dir",
        cfg as unknown as types.Config,
        defaultInputs,
      ),
    ).rejects.toThrow("isn't latest");
  });

  it("calls commit.create and throws 'is updated' when file changed and skip_push is false", async () => {
    const executor = createMockExecutor();
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(git.isFileTracked).mockResolvedValue(false);
    vi.mocked(commit.create).mockResolvedValue("");

    await expect(
      main(
        executor,
        "working-dir",
        defaultCfg as unknown as types.Config,
        defaultInputs,
      ),
    ).rejects.toThrow("is updated");

    expect(commit.create).toHaveBeenCalledWith({
      commitMessage: "chore(aqua): update aqua-checksums.json",
      githubToken: "token",
      rootDir: "/repo",
      files: new Set(["working-dir/aqua-checksums.json"]),
      serverRepository: "owner/repo",
      appId: "app-id",
      appPrivateKey: "app-key",
    });
  });

  it("passes correct relative path from git_root_dir to commit.create", async () => {
    const executor = createMockExecutor();
    // Only the third candidate matches (aqua/aqua-checksums.json)
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    vi.mocked(git.isFileTracked).mockResolvedValue(false);
    vi.mocked(commit.create).mockResolvedValue("");

    await expect(
      main(
        executor,
        "env/dev",
        defaultCfg as unknown as types.Config,
        defaultInputs,
      ),
    ).rejects.toThrow("is updated");

    expect(commit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        files: new Set(["env/dev/aqua/aqua-checksums.json"]),
      }),
    );
  });
});
