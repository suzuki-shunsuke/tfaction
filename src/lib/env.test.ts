import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Module-level constants (GITHUB_SERVER_URL, GITHUB_WORKSPACE, etc.) are evaluated
// at import time. We use vi.resetModules() + dynamic import() to re-evaluate them
// with different env vars in each test.

describe("env", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // Helper to clean env vars used in tests
  const clearEnvVars = (...keys: string[]) => {
    for (const key of keys) {
      delete process.env[key];
    }
  };

  describe("record()", () => {
    it("returns partial record with values from process.env for given keys", async () => {
      process.env.GITHUB_TOKEN = "my-token";
      process.env.PATH = "/usr/bin";
      const env = await import("./env");
      const result = env.record("GITHUB_TOKEN", "PATH");
      expect(result).toEqual({
        GITHUB_TOKEN: "my-token",
        PATH: "/usr/bin",
      });
    });

    it("returns empty string for unset keys", async () => {
      clearEnvVars("TFACTION_TARGET");
      const env = await import("./env");
      const result = env.record("TFACTION_TARGET");
      expect(result).toEqual({
        TFACTION_TARGET: "",
      });
    });

    it("returns empty object when called with no arguments", async () => {
      const env = await import("./env");
      const result = env.record();
      expect(result).toEqual({});
    });

    it("returns only the requested keys", async () => {
      process.env.GITHUB_TOKEN = "tok";
      process.env.GITHUB_REPOSITORY = "owner/repo";
      const env = await import("./env");
      const result = env.record("GITHUB_TOKEN");
      expect(result).toEqual({ GITHUB_TOKEN: "tok" });
      expect(result).not.toHaveProperty("GITHUB_REPOSITORY");
    });
  });

  describe("all", () => {
    it("contains expected keys from each category", async () => {
      const env = await import("./env");
      // GitHub Actions
      expect(env.all).toHaveProperty("GITHUB_TOKEN");
      expect(env.all).toHaveProperty("GITHUB_SERVER_URL");
      expect(env.all).toHaveProperty("GITHUB_REPOSITORY");
      // tfaction
      expect(env.all).toHaveProperty("TFACTION_CONFIG");
      expect(env.all).toHaveProperty("TFACTION_IS_APPLY");
      // ci-info
      expect(env.all).toHaveProperty("CI_INFO_PR_NUMBER");
      // aqua
      expect(env.all).toHaveProperty("AQUA_ROOT_DIR");
    });

    it("reads values from process.env", async () => {
      process.env.GITHUB_TOKEN = "test-token-123";
      process.env.TFACTION_TARGET = "aws/dev";
      const env = await import("./env");
      expect(env.all.GITHUB_TOKEN).toBe("test-token-123");
      expect(env.all.TFACTION_TARGET).toBe("aws/dev");
    });

    it("defaults to empty string for unset vars", async () => {
      clearEnvVars("TFACTION_DRIFT_ISSUE_NUMBER");
      const env = await import("./env");
      expect(env.all.TFACTION_DRIFT_ISSUE_NUMBER).toBe("");
    });
  });

  describe("GITHUB_SERVER_URL", () => {
    it("uses env value when set", async () => {
      process.env.GITHUB_SERVER_URL = "https://github.example.com";
      const env = await import("./env");
      expect(env.GITHUB_SERVER_URL).toBe("https://github.example.com");
    });

    it("defaults to https://github.com when not set", async () => {
      clearEnvVars("GITHUB_SERVER_URL");
      const env = await import("./env");
      expect(env.GITHUB_SERVER_URL).toBe("https://github.com");
    });

    it("defaults to https://github.com when empty string", async () => {
      process.env.GITHUB_SERVER_URL = "";
      const env = await import("./env");
      expect(env.GITHUB_SERVER_URL).toBe("https://github.com");
    });
  });

  describe("GITHUB_WORKSPACE", () => {
    it("uses env value when set", async () => {
      process.env.GITHUB_WORKSPACE = "/home/runner/work";
      const env = await import("./env");
      expect(env.GITHUB_WORKSPACE).toBe("/home/runner/work");
    });

    it("defaults to process.cwd() when not set", async () => {
      clearEnvVars("GITHUB_WORKSPACE");
      const env = await import("./env");
      expect(env.GITHUB_WORKSPACE).toBe(process.cwd());
    });

    it("defaults to process.cwd() when empty string", async () => {
      process.env.GITHUB_WORKSPACE = "";
      const env = await import("./env");
      expect(env.GITHUB_WORKSPACE).toBe(process.cwd());
    });
  });

  describe("TFACTION_SKIP_TERRAFORM", () => {
    it('true when "true"', async () => {
      process.env.TFACTION_SKIP_TERRAFORM = "true";
      const env = await import("./env");
      expect(env.TFACTION_SKIP_TERRAFORM).toBe(true);
    });

    it('false when "false"', async () => {
      process.env.TFACTION_SKIP_TERRAFORM = "false";
      const env = await import("./env");
      expect(env.TFACTION_SKIP_TERRAFORM).toBe(false);
    });

    it("false when not set", async () => {
      clearEnvVars("TFACTION_SKIP_TERRAFORM");
      const env = await import("./env");
      expect(env.TFACTION_SKIP_TERRAFORM).toBe(false);
    });

    it("false when other string value", async () => {
      process.env.TFACTION_SKIP_TERRAFORM = "yes";
      const env = await import("./env");
      expect(env.TFACTION_SKIP_TERRAFORM).toBe(false);
    });
  });

  describe("TFACTION_CONFIG", () => {
    it("uses env value when set", async () => {
      process.env.TFACTION_CONFIG = "custom-config.yaml";
      const env = await import("./env");
      expect(env.TFACTION_CONFIG).toBe("custom-config.yaml");
    });

    it("defaults to tfaction-root.yaml when not set", async () => {
      clearEnvVars("TFACTION_CONFIG");
      const env = await import("./env");
      expect(env.TFACTION_CONFIG).toBe("tfaction-root.yaml");
    });

    it("defaults to tfaction-root.yaml when empty string", async () => {
      process.env.TFACTION_CONFIG = "";
      const env = await import("./env");
      expect(env.TFACTION_CONFIG).toBe("tfaction-root.yaml");
    });
  });

  describe("isApply", () => {
    it('true when "true"', async () => {
      process.env.TFACTION_IS_APPLY = "true";
      const env = await import("./env");
      expect(env.isApply).toBe(true);
    });

    it('false when "false"', async () => {
      process.env.TFACTION_IS_APPLY = "false";
      const env = await import("./env");
      expect(env.isApply).toBe(false);
    });

    it("false when not set", async () => {
      clearEnvVars("TFACTION_IS_APPLY");
      const env = await import("./env");
      expect(env.isApply).toBe(false);
    });
  });

  describe("runURL", () => {
    it("constructs URL from all three env vars", async () => {
      process.env.GITHUB_SERVER_URL = "https://github.example.com";
      process.env.GITHUB_REPOSITORY = "owner/repo";
      process.env.GITHUB_RUN_ID = "12345";
      const env = await import("./env");
      expect(env.runURL).toBe(
        "https://github.example.com/owner/repo/actions/runs/12345",
      );
    });

    it("uses default GITHUB_SERVER_URL when not set", async () => {
      clearEnvVars("GITHUB_SERVER_URL");
      process.env.GITHUB_REPOSITORY = "owner/repo";
      process.env.GITHUB_RUN_ID = "99";
      const env = await import("./env");
      expect(env.runURL).toBe("https://github.com/owner/repo/actions/runs/99");
    });

    it("handles empty GITHUB_REPOSITORY and GITHUB_RUN_ID", async () => {
      clearEnvVars("GITHUB_SERVER_URL", "GITHUB_REPOSITORY", "GITHUB_RUN_ID");
      const env = await import("./env");
      expect(env.runURL).toBe("https://github.com//actions/runs/");
    });
  });
});
