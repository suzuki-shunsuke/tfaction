import { join } from "path";
import { describe, it, expect } from "vitest";
import {
  getOS,
  getArch,
  getInstallPath,
  buildArgs,
  buildEnv,
  type EnvDeps,
} from "./run";

describe("getOS", () => {
  it('returns "darwin" for "darwin"', () => {
    expect(getOS("darwin")).toBe("darwin");
  });
  it('returns "linux" for "linux"', () => {
    expect(getOS("linux")).toBe("linux");
  });
  it('returns "windows" for "win32"', () => {
    expect(getOS("win32")).toBe("windows");
  });
  it("throws for unsupported platform", () => {
    expect(() => getOS("freebsd")).toThrow("Unsupported OS: freebsd");
  });
});

describe("getArch", () => {
  it('returns "amd64" for "x64"', () => {
    expect(getArch("x64")).toBe("amd64");
  });
  it('returns "arm64" for "arm64"', () => {
    expect(getArch("arm64")).toBe("arm64");
  });
  it("throws for unsupported architecture", () => {
    expect(() => getArch("ia32")).toThrow("Unsupported architecture: ia32");
  });
});

describe("getInstallPath", () => {
  it("uses aquaRoot on windows when set", () => {
    const result = getInstallPath("windows", "/custom/root", "", "/home/user");
    expect(result).toBe(join("/custom/root", "bin", "aqua.exe"));
  });
  it("defaults to AppData path on windows when aquaRoot empty", () => {
    const result = getInstallPath("windows", "", "", "/home/user");
    expect(result).toBe(
      join(
        "/home/user",
        "AppData",
        "Local",
        "aquaproj-aqua",
        "bin",
        "aqua.exe",
      ),
    );
  });
  it("uses aquaRoot on non-windows when set", () => {
    const result = getInstallPath("linux", "/custom/root", "", "/home/user");
    expect(result).toBe(join("/custom/root", "bin", "aqua"));
  });
  it("uses XDG_DATA_HOME when set and aquaRoot empty", () => {
    const result = getInstallPath("linux", "", "/xdg/data", "/home/user");
    expect(result).toBe(join("/xdg/data", "aquaproj-aqua", "bin", "aqua"));
  });
  it("defaults to ~/.local/share when both aquaRoot and xdgDataHome empty", () => {
    const result = getInstallPath("linux", "", "", "/home/user");
    expect(result).toBe(
      join("/home/user", ".local", "share", "aquaproj-aqua", "bin", "aqua"),
    );
  });
});

describe("buildArgs", () => {
  it("returns command/args unchanged", () => {
    const result = buildArgs("terraform", ["plan"]);
    expect(result).toEqual({
      command: "terraform",
      args: ["plan"],
    });
  });
  it("handles empty/undefined args", () => {
    const result = buildArgs("terraform", undefined);
    expect(result).toEqual({
      command: "terraform",
      args: undefined,
    });
  });
});

describe("buildEnv", () => {
  const baseDeps: EnvDeps = {
    processEnv: { EXISTING: "val" },
    path: "/usr/bin",
    aquaGlobalConfig: "/path/to/aqua.yaml",
  };

  it("sets AQUA_GLOBAL_CONFIG from deps", () => {
    const result = buildEnv(baseDeps, "");
    expect(result.AQUA_GLOBAL_CONFIG).toBe("/path/to/aqua.yaml");
  });
  it("appends installDir to PATH when non-empty", () => {
    const result = buildEnv(baseDeps, "/install/dir");
    expect(result.PATH).toBe("/usr/bin:/install/dir");
  });
  it("does not modify PATH when installDir empty", () => {
    const result = buildEnv(baseDeps, "");
    expect(result.PATH).toBeUndefined();
    expect(result.EXISTING).toBe("val");
  });
  it("sets AQUA_GITHUB_TOKEN when githubToken provided", () => {
    const result = buildEnv(baseDeps, "", "gh-token");
    expect(result.AQUA_GITHUB_TOKEN).toBe("gh-token");
  });
  it("does not set comment-related env vars when comment present", () => {
    const result = buildEnv(baseDeps, "", undefined, {
      comment: { token: "comment-token" },
    });
    expect(result.GITHUB_ACCESS_TOKEN).toBeUndefined();
    expect(result.GH_COMMENT_CONFIG).toBeUndefined();
  });
  it("includes secretEnvs when provided", () => {
    const result = buildEnv(baseDeps, "", undefined, {
      secretEnvs: { SECRET_KEY: "secret_value", API_TOKEN: "token123" },
    });
    expect(result.SECRET_KEY).toBe("secret_value");
    expect(result.API_TOKEN).toBe("token123");
    expect(result.EXISTING).toBe("val");
  });
  it("secretEnvs are overridden by options.env and dynamic env", () => {
    const result = buildEnv(baseDeps, "/install", "gh-tok", {
      secretEnvs: {
        PATH: "/secret-path",
        TFMIGRATE_EXEC_PATH: "from-secret",
      },
      env: { TFMIGRATE_EXEC_PATH: "from-opt" },
    });
    // dynamic env PATH wins over secretEnvs PATH
    expect(result.PATH).toBe("/usr/bin:/install");
    // options.env TFMIGRATE_EXEC_PATH wins over secretEnvs
    expect(result.TFMIGRATE_EXEC_PATH).toBe("from-opt");
  });
  it("merge precedence: dynamic env > options.env > processEnv", () => {
    const deps: EnvDeps = {
      processEnv: {
        PATH: "/proc",
        GITHUB_TOKEN: "proc-tok",
        FOO: "from-proc",
      },
      path: "/proc",
      aquaGlobalConfig: "/aqua.yaml",
    };
    const result = buildEnv(deps, "/install", "gh-tok", {
      env: { PATH: "/opt-path" },
    });
    // dynamic env (PATH with installDir) wins over options.env and processEnv
    expect(result.PATH).toBe("/proc:/install");
    // processEnv value preserved when not overridden
    expect(result.FOO).toBe("from-proc");
  });
});
