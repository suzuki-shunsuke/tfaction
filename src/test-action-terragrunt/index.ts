import * as fs from "fs";
import { diffString } from "json-diff";

type TestData = {
  name: string;
  expected: any;
  actual: any;
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
        JSON.parse(process.env.LIST_MODULE_CALLERS || "{}").file || "dummy",
        "utf8",
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
