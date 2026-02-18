import { describe, expect, it } from "vitest";
import { mergeSecrets } from "./secret";

describe("mergeSecrets", () => {
  it("returns undefined when both are undefined", () => {
    expect(mergeSecrets(undefined, undefined)).toBeUndefined();
  });

  it("returns undefined when both are empty strings", () => {
    expect(mergeSecrets("", "")).toBeUndefined();
  });

  it("returns parsed secrets when only secrets is provided", () => {
    expect(mergeSecrets('{"A":"1","B":"2"}', undefined)).toEqual({
      A: "1",
      B: "2",
    });
  });

  it("returns parsed awsSecrets when only awsSecrets is provided", () => {
    expect(mergeSecrets(undefined, '{"C":"3"}')).toEqual({ C: "3" });
  });

  it("merges both, awsSecrets overrides on conflict", () => {
    const secrets = '{"A":"1","B":"2"}';
    const awsSecrets = '{"B":"override","C":"3"}';
    expect(mergeSecrets(secrets, awsSecrets)).toEqual({
      A: "1",
      B: "override",
      C: "3",
    });
  });

  it("treats empty string as undefined for secrets", () => {
    expect(mergeSecrets("", '{"A":"1"}')).toEqual({ A: "1" });
  });

  it("treats empty string as undefined for awsSecrets", () => {
    expect(mergeSecrets('{"A":"1"}', "")).toEqual({ A: "1" });
  });
});
