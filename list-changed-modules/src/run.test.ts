import { run } from "./run";

test("default", () => {
  expect(
    run(
      ["foo/dev/tfaction_module.yaml", "foo/prod/tfaction_module.yaml"],
      ["foo/dev/main.tf"],
    ),
  ).toStrictEqual(["foo/dev"]);
});
