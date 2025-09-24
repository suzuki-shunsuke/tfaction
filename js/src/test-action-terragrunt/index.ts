import * as lib from "../lib";
import * as core from "@actions/core";
import * as fs from "fs";
import { diffString } from "json-diff";

type TestData = {
  name: string;
  expected: {
    file: any;
  };
  actual: any;
};

export const main = async () => {
  // Compare outputs
  const testdata: TestData[] = [
    {
      name: "list-module-callers",
      expected: {
        file: { "setup/test/terragrunt/module": ["setup/test/terragrunt/foo"] },
      },
      actual: JSON.parse(
        fs.readFileSync(process.env.LIST_MODULE_CALLERS || "dummy", "utf8"),
      ),
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
