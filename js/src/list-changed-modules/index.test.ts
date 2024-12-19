import { run } from "./index";

test("default", () => {
  expect(
    run(
      ["foo/dev/tfaction_module.yaml", "foo/prod/tfaction_module.yaml"],
      ["foo/dev/main.tf"],
    ),
  ).toStrictEqual(["foo/dev"]);
});
