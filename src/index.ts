import * as core from "@actions/core";
import { main } from "./run";
import * as testAction from "./test-action";
import * as testActionTerragrunt from "./test-action-terragrunt";
import { generateJSONSchema } from "./lib";
import * as env from "./lib/env";

try {
  if (env.tfactionTestAction) {
    await testAction.main();
  } else if (env.tfactionTestActionTerragrunt) {
    await testActionTerragrunt.main();
  } else if (env.tfactionGenerateJsonSchema) {
    generateJSONSchema("schema");
  } else {
    await main({
      action: core.getInput("action"),
    });
  }
} catch (error) {
  core.setFailed(
    error instanceof Error ? error.message : JSON.stringify(error),
  );
}
