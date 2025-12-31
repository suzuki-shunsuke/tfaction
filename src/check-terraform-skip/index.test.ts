import { getSkipTerraform } from "./index";
import { expect, test } from "vitest";

test("normal", () => {
  expect(
    getSkipTerraform(
      {
        skipLabelPrefix: "skip:",
        labels: "",
        prAuthor: "octocat",
        target: "foo",
      },
      {
        plan_workflow_name: "",
        target_groups: [],
      },
      [],
    ),
  ).toBe(false);
});

test("target is required", () => {
  expect(() => {
    getSkipTerraform(
      {
        skipLabelPrefix: "skip:",
        labels: "",
        prAuthor: "octocat",
      },
      {
        plan_workflow_name: "",
        target_groups: [],
      },
      [],
    );
  }).toThrow();
});

test("skip label", () => {
  expect(
    getSkipTerraform(
      {
        skipLabelPrefix: "skip:",
        labels: "",
        prAuthor: "octocat",
        target: "foo",
      },
      {
        plan_workflow_name: "",
        target_groups: [],
      },
      ["skip:foo"],
    ),
  ).toBe(true);
});

test("renovate", () => {
  expect(
    getSkipTerraform(
      {
        skipLabelPrefix: "skip:",
        labels: "",
        prAuthor: "renovate[bot]",
        target: "foo",
      },
      {
        plan_workflow_name: "",
        target_groups: [],
      },
      [],
    ),
  ).toBe(false);
});

test("skip_terraform_by_renovate", () => {
  expect(
    getSkipTerraform(
      {
        skipLabelPrefix: "skip:",
        labels: "",
        prAuthor: "renovate[bot]",
        target: "foo",
      },
      {
        plan_workflow_name: "",
        target_groups: [],
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
        labels: "",
        prAuthor: "renovate[bot]",
        target: "foo",
      },
      {
        plan_workflow_name: "",
        target_groups: [],
        skip_terraform_by_renovate: true,
      },
      ["terraform"],
    ),
  ).toBe(false);
});
