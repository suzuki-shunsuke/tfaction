import { describe, it, expect, vi } from "vitest";
import { buildSecretsToExport, run, type RunInput } from "./run";

describe("buildSecretsToExport", () => {
  it("handles single secret without secret_key (plain string value)", () => {
    const secrets = [
      {
        secret_id: "my-secret",
        envs: [{ env_name: "MY_SECRET" }],
      },
    ];
    const secretValues = new Map([["my-secret", "plain-secret-value"]]);

    const result = buildSecretsToExport(secrets, secretValues);

    expect(result).toEqual([
      {
        envName: "MY_SECRET",
        secretId: "my-secret",
        secretValue: "plain-secret-value",
        secretKey: "",
      },
    ]);
  });

  it("handles single secret with secret_key (JSON parsing)", () => {
    const secrets = [
      {
        secret_id: "my-json-secret",
        envs: [{ env_name: "DB_PASSWORD", secret_key: "password" }],
      },
    ];
    const secretValues = new Map([
      [
        "my-json-secret",
        JSON.stringify({ username: "admin", password: "secret123" }),
      ],
    ]);

    const result = buildSecretsToExport(secrets, secretValues);

    expect(result).toEqual([
      {
        envName: "DB_PASSWORD",
        secretId: "my-json-secret",
        secretValue: "secret123",
        secretKey: "password",
      },
    ]);
  });

  it("handles multiple envs from same secret_id", () => {
    const secrets = [
      {
        secret_id: "db-credentials",
        envs: [
          { env_name: "DB_USER", secret_key: "username" },
          { env_name: "DB_PASS", secret_key: "password" },
        ],
      },
    ];
    const secretValues = new Map([
      [
        "db-credentials",
        JSON.stringify({ username: "admin", password: "secret123" }),
      ],
    ]);

    const result = buildSecretsToExport(secrets, secretValues);

    expect(result).toEqual([
      {
        envName: "DB_USER",
        secretId: "db-credentials",
        secretValue: "admin",
        secretKey: "username",
      },
      {
        envName: "DB_PASS",
        secretId: "db-credentials",
        secretValue: "secret123",
        secretKey: "password",
      },
    ]);
  });

  it("handles multiple secrets", () => {
    const secrets = [
      {
        secret_id: "secret-1",
        envs: [{ env_name: "SECRET_1" }],
      },
      {
        secret_id: "secret-2",
        envs: [{ env_name: "SECRET_2", secret_key: "key" }],
      },
    ];
    const secretValues = new Map([
      ["secret-1", "plain-value"],
      ["secret-2", JSON.stringify({ key: "json-value" })],
    ]);

    const result = buildSecretsToExport(secrets, secretValues);

    expect(result).toEqual([
      {
        envName: "SECRET_1",
        secretId: "secret-1",
        secretValue: "plain-value",
        secretKey: "",
      },
      {
        envName: "SECRET_2",
        secretId: "secret-2",
        secretValue: "json-value",
        secretKey: "key",
      },
    ]);
  });

  it("throws error when secret_id is missing", () => {
    const secrets = [
      {
        secret_id: "",
        envs: [{ env_name: "MY_SECRET" }],
      },
    ];
    const secretValues = new Map<string, string>();

    expect(() => buildSecretsToExport(secrets, secretValues)).toThrow(
      "secret_id is required",
    );
  });

  it("throws error when env_name is missing", () => {
    const secrets = [
      {
        secret_id: "my-secret",
        envs: [{ env_name: "" }],
      },
    ];
    const secretValues = new Map([["my-secret", "value"]]);

    expect(() => buildSecretsToExport(secrets, secretValues)).toThrow(
      "env_name is required: secret_id=my-secret",
    );
  });

  it("throws error when secret_key is not found in JSON", () => {
    const secrets = [
      {
        secret_id: "my-json-secret",
        envs: [{ env_name: "MISSING_KEY", secret_key: "nonexistent" }],
      },
    ];
    const secretValues = new Map([
      ["my-json-secret", JSON.stringify({ existing: "value" })],
    ]);

    expect(() => buildSecretsToExport(secrets, secretValues)).toThrow(
      "secret key isn't found: secret_key=nonexistent secret_id=my-json-secret",
    );
  });

  it("throws error when secret value is not found", () => {
    const secrets = [
      {
        secret_id: "missing-secret",
        envs: [{ env_name: "MY_SECRET" }],
      },
    ];
    const secretValues = new Map<string, string>();

    expect(() => buildSecretsToExport(secrets, secretValues)).toThrow(
      "Secret value not found for secret_id=missing-secret",
    );
  });

  it("handles empty secrets array", () => {
    const result = buildSecretsToExport([], new Map());
    expect(result).toEqual([]);
  });

  it("handles mixed plain and JSON values in same secret", () => {
    const secrets = [
      {
        secret_id: "mixed-secret",
        envs: [
          { env_name: "FULL_SECRET" }, // Plain value
          { env_name: "PARTIAL_SECRET", secret_key: "key1" }, // JSON key
        ],
      },
    ];
    const secretValues = new Map([
      ["mixed-secret", JSON.stringify({ key1: "value1", key2: "value2" })],
    ]);

    const result = buildSecretsToExport(secrets, secretValues);

    expect(result).toEqual([
      {
        envName: "FULL_SECRET",
        secretId: "mixed-secret",
        secretValue: JSON.stringify({ key1: "value1", key2: "value2" }),
        secretKey: "",
      },
      {
        envName: "PARTIAL_SECRET",
        secretId: "mixed-secret",
        secretValue: "value1",
        secretKey: "key1",
      },
    ]);
  });
});

describe("run", () => {
  it("returns empty array when no secrets configured", async () => {
    const input: RunInput = {
      getSecretValue: vi.fn(),
    };

    const result = await run(input);

    expect(result).toEqual([]);
    expect(input.getSecretValue).not.toHaveBeenCalled();
  });

  it("returns empty array when both group and job config secrets are empty", async () => {
    const input: RunInput = {
      groupSecrets: [],
      jobConfigSecrets: [],
      getSecretValue: vi.fn(),
    };

    const result = await run(input);

    expect(result).toEqual([]);
    expect(input.getSecretValue).not.toHaveBeenCalled();
  });

  it("processes only group secrets when job config secrets are undefined", async () => {
    const getSecretValue = vi.fn().mockResolvedValue("secret-value");
    const input: RunInput = {
      groupSecrets: [
        {
          secret_id: "group-secret",
          envs: [{ env_name: "GROUP_SECRET" }],
        },
      ],
      getSecretValue,
    };

    const result = await run(input);

    expect(result).toEqual([
      {
        envName: "GROUP_SECRET",
        secretId: "group-secret",
        secretValue: "secret-value",
        secretKey: "",
      },
    ]);
    expect(getSecretValue).toHaveBeenCalledWith("group-secret");
    expect(getSecretValue).toHaveBeenCalledTimes(1);
  });

  it("processes only job config secrets when group secrets are undefined", async () => {
    const getSecretValue = vi.fn().mockResolvedValue("job-secret-value");
    const input: RunInput = {
      jobConfigSecrets: [
        {
          secret_id: "job-secret",
          envs: [{ env_name: "JOB_SECRET" }],
        },
      ],
      getSecretValue,
    };

    const result = await run(input);

    expect(result).toEqual([
      {
        envName: "JOB_SECRET",
        secretId: "job-secret",
        secretValue: "job-secret-value",
        secretKey: "",
      },
    ]);
    expect(getSecretValue).toHaveBeenCalledWith("job-secret");
  });

  it("combines group and job config secrets", async () => {
    const getSecretValue = vi.fn().mockImplementation((secretId: string) => {
      if (secretId === "group-secret") return Promise.resolve("group-value");
      if (secretId === "job-secret") return Promise.resolve("job-value");
      return Promise.reject(new Error("Unknown secret"));
    });
    const input: RunInput = {
      groupSecrets: [
        {
          secret_id: "group-secret",
          envs: [{ env_name: "GROUP_SECRET" }],
        },
      ],
      jobConfigSecrets: [
        {
          secret_id: "job-secret",
          envs: [{ env_name: "JOB_SECRET" }],
        },
      ],
      getSecretValue,
    };

    const result = await run(input);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      envName: "GROUP_SECRET",
      secretId: "group-secret",
      secretValue: "group-value",
      secretKey: "",
    });
    expect(result[1]).toEqual({
      envName: "JOB_SECRET",
      secretId: "job-secret",
      secretValue: "job-value",
      secretKey: "",
    });
  });

  it("fetches each unique secret_id only once", async () => {
    const getSecretValue = vi
      .fn()
      .mockResolvedValue(JSON.stringify({ key: "value" }));
    const input: RunInput = {
      groupSecrets: [
        {
          secret_id: "shared-secret",
          envs: [{ env_name: "GROUP_KEY", secret_key: "key" }],
        },
      ],
      jobConfigSecrets: [
        {
          secret_id: "shared-secret",
          envs: [{ env_name: "JOB_KEY", secret_key: "key" }],
        },
      ],
      getSecretValue,
    };

    await run(input);

    expect(getSecretValue).toHaveBeenCalledTimes(1);
    expect(getSecretValue).toHaveBeenCalledWith("shared-secret");
  });

  it("handles multiple secrets with JSON values", async () => {
    const getSecretValue = vi.fn().mockImplementation((secretId: string) => {
      if (secretId === "db-creds") {
        return Promise.resolve(
          JSON.stringify({ user: "admin", pass: "secret" }),
        );
      }
      if (secretId === "api-key") {
        return Promise.resolve("raw-api-key");
      }
      return Promise.reject(new Error("Unknown secret"));
    });
    const input: RunInput = {
      groupSecrets: [
        {
          secret_id: "db-creds",
          envs: [
            { env_name: "DB_USER", secret_key: "user" },
            { env_name: "DB_PASS", secret_key: "pass" },
          ],
        },
      ],
      jobConfigSecrets: [
        {
          secret_id: "api-key",
          envs: [{ env_name: "API_KEY" }],
        },
      ],
      getSecretValue,
    };

    const result = await run(input);

    expect(result).toEqual([
      {
        envName: "DB_USER",
        secretId: "db-creds",
        secretValue: "admin",
        secretKey: "user",
      },
      {
        envName: "DB_PASS",
        secretId: "db-creds",
        secretValue: "secret",
        secretKey: "pass",
      },
      {
        envName: "API_KEY",
        secretId: "api-key",
        secretValue: "raw-api-key",
        secretKey: "",
      },
    ]);
  });
});
