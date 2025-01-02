import * as lib from "../lib";
import * as core from "@actions/core";
import * as fs from "fs";
import { diffString } from "json-diff";

type TestData = {
  name: string;
  expected: {
    file: string;
  };
  actual: string;
};

export const main = async () => {
  // Compare outputs
  const testdata: TestData[] = [
    {
      name: "list-module-callers",
      expected: {
        file: '{"setup/test/terragrunt/module":["setup/test/terragrunt/foo"]}',
      },
      actual: process.env.LIST_MODULE_CALLERS || "",
    },
  ];
  let failed = false;
  testdata.forEach((data) => {
    let a = JSON.parse(data.actual || "{}");
    const b = diffString(data.expected, a);
    if (b !== "") {
      console.log(`Test failed: ${data.name}`);
      console.log(b);
      failed = true;
    }
  });
  if (failed) {
    throw new Error("Test failed");
  }
};
