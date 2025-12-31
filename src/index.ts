import * as core from "@actions/core";
import { main } from "./run";
import * as testAction from "./test-action";
import * as testActionTerragrunt from "./test-action-terragrunt";
import { generateJSONSchema } from "./lib";

try {
  if (process.env.TFACTION_TEST_ACTION) {
    await testAction.main();
  } else if (process.env.TFACTION_TEST_ACTION_TERRAGRUNT) {
    await testActionTerragrunt.main();
  } else if (process.env.TFACTION_GENERATE_JSON_SCHEMA) {
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
