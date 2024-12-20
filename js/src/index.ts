import * as core from "@actions/core";
import { main } from "./run";
import * as testAction from "./test-action";

try {
  if (process.env.TFACTION_TEST_ACTION) {
    testAction.main();
  } else {
    main({
      action: core.getInput("action"),
    });
  }
} catch (error) {
  core.setFailed(
    error instanceof Error ? error.message : JSON.stringify(error),
  );
}
