import * as core from "@actions/core";
import * as lib from "./lib";

try {
  const config = lib.getConfig();
  const secrets = new Map<string, string>(
    Object.entries(JSON.parse(core.getInput("secrets"))),
  );

  // Log the list of secrets for troubleshooting
  // https://github.com/suzuki-shunsuke/tfaction/issues/1564
  core.info(
    `The list of secret names passed to the action: ${Array.from(secrets.keys()).join(", ")}`,
  );

  const targetS = lib.getTarget();
  const jobType = lib.getJobType();
  const isApply = lib.getIsApply();
  const targetConfig = lib.getTargetConfig(config.target_groups, targetS);
  const jobConfig = lib.getJobConfig(targetConfig, isApply, jobType);
  for (let [envName, secretName] of lib.getSecrets(targetConfig, jobConfig)) {
    if (!secrets.has(secretName)) {
      throw new Error(`secret is not found: ${secretName}`);
    }
    const secretValue = secrets.get(secretName);
    core.info(
      `export the secret ${secretName} as the environment variable ${envName}`,
    );
    core.exportVariable(envName, secretValue);
  }
} catch (error) {
  core.setFailed(
    error instanceof Error ? error.message : JSON.stringify(error),
  );
}
