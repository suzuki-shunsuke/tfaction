import * as core from "@actions/core";
import { main } from "./run";
import * as testAction from "./test-action";
import * as testActionTerragrunt from "./test-action-terragrunt";
import { generateJSONSchema } from "./lib/json_schema";
import * as env from "./lib/env";
import * as input from "./lib/input";

try {
  if (env.all.TFACTION_TEST_ACTION) {
    await testAction.main();
  } else if (env.all.TFACTION_TEST_ACTION_TERRAGRUNT) {
    await testActionTerragrunt.main();
  } else if (env.all.TFACTION_GENERATE_JSON_SCHEMA) {
    generateJSONSchema("schema");
  } else {
    await main({
      action: input.action,
    });
  }
} catch (error) {
  core.setFailed(
    error instanceof Error ? error.message : JSON.stringify(error),
  );
}
