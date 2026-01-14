import * as fs from "fs";
import { diffString } from "json-diff";
import * as env from "../lib/env";

type TestData = {
  name: string;
  expected: Record<string, string[]>;
  actual: string;
};

export const main = async () => {
  // Compare outputs
  const testdata: TestData[] = [
    {
      name: "list-module-callers",
      expected: {
        "setup/test/terragrunt/module": ["setup/test/terragrunt/foo"],
      },
      actual: fs.readFileSync(
        JSON.parse(env.listModuleCallers || "{}").file || "dummy",
        "utf8",
      ),
    },
  ];
  let failed = false;
  testdata.forEach((data) => {
    const a = JSON.parse(data.actual || "{}");
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
