import { getSkipTerraform } from "./index";
import { expect, test } from "vitest";

test("normal", () => {
  expect(
    getSkipTerraform(
      {
        skipLabelPrefix: "skip:",
        labels: [],
        prAuthor: "octocat",
        target: "foo",
      },
      {},
      [],
    ),
  ).toBe(false);
});

test("target is required", () => {
  expect(() => {
    getSkipTerraform(
      {
        skipLabelPrefix: "skip:",
        labels: [],
        prAuthor: "octocat",
      },
      {},
      [],
    );
  }).toThrow();
});

test("skip label", () => {
  expect(
    getSkipTerraform(
      {
        skipLabelPrefix: "skip:",
        labels: [],
        prAuthor: "octocat",
        target: "foo",
      },
      {},
      ["skip:foo"],
    ),
  ).toBe(true);
});

test("renovate", () => {
  expect(
    getSkipTerraform(
      {
        skipLabelPrefix: "skip:",
        labels: [],
        prAuthor: "renovate[bot]",
        target: "foo",
      },
      {},
      [],
    ),
  ).toBe(false);
});

test("skip_terraform_by_renovate", () => {
  expect(
    getSkipTerraform(
      {
        skipLabelPrefix: "skip:",
        labels: [],
        prAuthor: "renovate[bot]",
        target: "foo",
      },
      {
        skip_terraform_by_renovate: true,
      },
      [],
    ),
  ).toBe(true);
});

test("skip_terraform_by_renovate skip", () => {
  expect(
    getSkipTerraform(
      {
        skipLabelPrefix: "skip:",
        labels: [],
        prAuthor: "renovate[bot]",
        target: "foo",
      },
      {
        skip_terraform_by_renovate: true,
      },
      ["terraform"],
    ),
  ).toBe(false);
});

test("custom renovate_login", () => {
  expect(
    getSkipTerraform(
      {
        skipLabelPrefix: "skip:",
        labels: [],
        prAuthor: "my-renovate-bot",
        target: "foo",
      },
      {
        renovate_login: "my-renovate-bot",
        skip_terraform_by_renovate: true,
      },
      [],
    ),
  ).toBe(true);
});

test("custom renovate_terraform_labels", () => {
  expect(
    getSkipTerraform(
      {
        skipLabelPrefix: "skip:",
        labels: [],
        prAuthor: "renovate[bot]",
        target: "foo",
      },
      {
        skip_terraform_by_renovate: true,
        renovate_terraform_labels: ["infra", "tf"],
      },
      ["infra"],
    ),
  ).toBe(false);
});

test("skip label does not match different target", () => {
  expect(
    getSkipTerraform(
      {
        skipLabelPrefix: "skip:",
        labels: [],
        prAuthor: "octocat",
        target: "foo",
      },
      {},
      ["skip:bar"],
    ),
  ).toBe(false);
});

test("multiple labels with matching skip label", () => {
  expect(
    getSkipTerraform(
      {
        skipLabelPrefix: "skip:",
        labels: [],
        prAuthor: "octocat",
        target: "foo",
      },
      {},
      ["enhancement", "skip:foo", "bug"],
    ),
  ).toBe(true);
});
