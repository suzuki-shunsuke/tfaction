import { describe, it, expect } from "vitest";
import {
  setSecretToMap,
  getSecrets,
  run,
  type Secret,
  type RunInput,
} from "./run";

describe("setSecretToMap", () => {
  it("sets both env_name and secret_name when both are provided", () => {
    const secrets: Secret[] = [
      { env_name: "MY_ENV", secret_name: "my_secret" },
    ];
    const m = new Map<string, string>();
    setSecretToMap(secrets, m);
    expect(m.get("MY_ENV")).toBe("my_secret");
  });

  it("uses env_name as secret_name when only env_name is provided", () => {
    const secrets: Secret[] = [
      { env_name: "MY_ENV", secret_name: undefined },
    ];
    const m = new Map<string, string>();
    setSecretToMap(secrets, m);
    expect(m.get("MY_ENV")).toBe("MY_ENV");
  });

  it("uses secret_name as env_name when only secret_name is provided", () => {
    const secrets: Secret[] = [
      { env_name: undefined, secret_name: "my_secret" },
    ];
    const m = new Map<string, string>();
    setSecretToMap(secrets, m);
    expect(m.get("my_secret")).toBe("my_secret");
  });

  it("throws error when both env_name and secret_name are undefined", () => {
    const secrets: Secret[] = [{ env_name: undefined, secret_name: undefined }];
    const m = new Map<string, string>();
    expect(() => setSecretToMap(secrets, m)).toThrow(
      "either secret_name or env_name is required",
    );
  });

  it("handles multiple secrets", () => {
    const secrets: Secret[] = [
      { env_name: "ENV1", secret_name: "secret1" },
      { env_name: "ENV2", secret_name: "secret2" },
      { env_name: "ENV3", secret_name: undefined },
    ];
    const m = new Map<string, string>();
    setSecretToMap(secrets, m);
    expect(m.size).toBe(3);
    expect(m.get("ENV1")).toBe("secret1");
    expect(m.get("ENV2")).toBe("secret2");
    expect(m.get("ENV3")).toBe("ENV3");
  });

  it("overwrites existing keys in the map", () => {
    const secrets: Secret[] = [{ env_name: "ENV1", secret_name: "new_secret" }];
    const m = new Map<string, string>([["ENV1", "old_secret"]]);
    setSecretToMap(secrets, m);
    expect(m.get("ENV1")).toBe("new_secret");
  });
});

describe("getSecrets", () => {
  it("returns secrets from targetSecrets only", () => {
    const targetSecrets: Secret[] = [
      { env_name: "TARGET_ENV", secret_name: "target_secret" },
    ];
    const result = getSecrets(targetSecrets, undefined);
    expect(result.size).toBe(1);
    expect(result.get("TARGET_ENV")).toBe("target_secret");
  });

  it("returns secrets from jobConfigSecrets only", () => {
    const jobConfigSecrets: Secret[] = [
      { env_name: "JOB_ENV", secret_name: "job_secret" },
    ];
    const result = getSecrets(undefined, jobConfigSecrets);
    expect(result.size).toBe(1);
    expect(result.get("JOB_ENV")).toBe("job_secret");
  });

  it("merges secrets from both targetSecrets and jobConfigSecrets", () => {
    const targetSecrets: Secret[] = [
      { env_name: "TARGET_ENV", secret_name: "target_secret" },
    ];
    const jobConfigSecrets: Secret[] = [
      { env_name: "JOB_ENV", secret_name: "job_secret" },
    ];
    const result = getSecrets(targetSecrets, jobConfigSecrets);
    expect(result.size).toBe(2);
    expect(result.get("TARGET_ENV")).toBe("target_secret");
    expect(result.get("JOB_ENV")).toBe("job_secret");
  });

  it("jobConfigSecrets overwrites targetSecrets for same env_name", () => {
    const targetSecrets: Secret[] = [
      { env_name: "SHARED_ENV", secret_name: "target_secret" },
    ];
    const jobConfigSecrets: Secret[] = [
      { env_name: "SHARED_ENV", secret_name: "job_secret" },
    ];
    const result = getSecrets(targetSecrets, jobConfigSecrets);
    expect(result.size).toBe(1);
    expect(result.get("SHARED_ENV")).toBe("job_secret");
  });

  it("returns empty map when both are undefined", () => {
    const result = getSecrets(undefined, undefined);
    expect(result.size).toBe(0);
  });

  it("returns empty map when both are empty arrays", () => {
    const result = getSecrets([], []);
    expect(result.size).toBe(0);
  });
});

describe("run", () => {
  it("returns secrets to export when all secrets are found", () => {
    const input: RunInput = {
      targetSecrets: [{ env_name: "MY_ENV", secret_name: "my_secret" }],
      jobConfigSecrets: undefined,
      inputSecrets: new Map([["my_secret", "secret_value"]]),
    };

    const result = run(input);

    expect(result.secretsToExport).toHaveLength(1);
    expect(result.secretsToExport[0]).toEqual({
      envName: "MY_ENV",
      secretName: "my_secret",
      secretValue: "secret_value",
    });
  });

  it("throws error when secret is not found in inputSecrets", () => {
    const input: RunInput = {
      targetSecrets: [{ env_name: "MY_ENV", secret_name: "missing_secret" }],
      jobConfigSecrets: undefined,
      inputSecrets: new Map([["other_secret", "value"]]),
    };

    expect(() => run(input)).toThrow("secret is not found: missing_secret");
  });

  it("returns empty array when no secrets are configured", () => {
    const input: RunInput = {
      targetSecrets: undefined,
      jobConfigSecrets: undefined,
      inputSecrets: new Map([["unused_secret", "value"]]),
    };

    const result = run(input);

    expect(result.secretsToExport).toHaveLength(0);
  });

  it("handles multiple secrets from both target and job config", () => {
    const input: RunInput = {
      targetSecrets: [
        { env_name: "TARGET_ENV1", secret_name: "target_secret1" },
        { env_name: "TARGET_ENV2", secret_name: "target_secret2" },
      ],
      jobConfigSecrets: [
        { env_name: "JOB_ENV", secret_name: "job_secret" },
      ],
      inputSecrets: new Map([
        ["target_secret1", "value1"],
        ["target_secret2", "value2"],
        ["job_secret", "value3"],
      ]),
    };

    const result = run(input);

    expect(result.secretsToExport).toHaveLength(3);
    expect(result.secretsToExport).toContainEqual({
      envName: "TARGET_ENV1",
      secretName: "target_secret1",
      secretValue: "value1",
    });
    expect(result.secretsToExport).toContainEqual({
      envName: "TARGET_ENV2",
      secretName: "target_secret2",
      secretValue: "value2",
    });
    expect(result.secretsToExport).toContainEqual({
      envName: "JOB_ENV",
      secretName: "job_secret",
      secretValue: "value3",
    });
  });

  it("handles secrets with empty string values", () => {
    const input: RunInput = {
      targetSecrets: [{ env_name: "MY_ENV", secret_name: "my_secret" }],
      jobConfigSecrets: undefined,
      inputSecrets: new Map([["my_secret", ""]]),
    };

    const result = run(input);

    expect(result.secretsToExport).toHaveLength(1);
    expect(result.secretsToExport[0].secretValue).toBe("");
  });

  it("uses env_name as secret_name when secret_name is not provided", () => {
    const input: RunInput = {
      targetSecrets: [{ env_name: "MY_SECRET", secret_name: undefined }],
      jobConfigSecrets: undefined,
      inputSecrets: new Map([["MY_SECRET", "secret_value"]]),
    };

    const result = run(input);

    expect(result.secretsToExport).toHaveLength(1);
    expect(result.secretsToExport[0]).toEqual({
      envName: "MY_SECRET",
      secretName: "MY_SECRET",
      secretValue: "secret_value",
    });
  });
});
