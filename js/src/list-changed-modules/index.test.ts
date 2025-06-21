import { run } from "./index";
import { expect, test } from 'vitest';

test("default", () => {
  expect(
    run(
      ["foo/dev/tfaction_module.yaml", "foo/prod/tfaction_module.yaml"],
      ["foo/dev/main.tf"],
    ),
  ).toStrictEqual(["foo/dev"]);
});
