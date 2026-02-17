import { expect, test } from "vitest";
import { run } from "./run";

test("maps secrets correctly via secretsConfig", () => {
  const result = run({
    githubSecrets: JSON.stringify({
      MY_SECRET: "secret_value_1",
      OTHER_SECRET: "secret_value_2",
    }),
    secretsConfig: {
      ENV_VAR_1: "MY_SECRET",
      ENV_VAR_2: "OTHER_SECRET",
    },
  });
  expect(result.secrets).toEqual({
    ENV_VAR_1: "secret_value_1",
    ENV_VAR_2: "secret_value_2",
  });
});

test("returns empty object when secretsConfig is undefined", () => {
  const result = run({
    githubSecrets: JSON.stringify({ MY_SECRET: "value" }),
  });
  expect(result.secrets).toEqual({});
});

test("throws when a required secret is not found in githubSecrets", () => {
  expect(() =>
    run({
      githubSecrets: JSON.stringify({}),
      secretsConfig: {
        ENV_VAR: "MISSING_SECRET",
      },
    }),
  ).toThrow("secret is not found: MISSING_SECRET");
});

test("handles empty secretsConfig", () => {
  const result = run({
    githubSecrets: JSON.stringify({ MY_SECRET: "value" }),
    secretsConfig: {},
  });
  expect(result.secrets).toEqual({});
});
