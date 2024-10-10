import * as core from "@actions/core";
import * as lib from "lib";
import * as path from "path";

type Inputs = {
  target?: string;
  workingDir?: string;
};

export const main = () => {
  run(
    {
      target: process.env.TFACTION_TARGET,
      workingDir: process.env.TFACTION_WORKING_DIR,
    },
    lib.getConfig(),
  );
};

export const run = (inputs: Inputs, config: lib.Config) => {
  const workingDirectoryFile = config.working_directory_file ?? "tfaction.yaml";

  let target = inputs.target;
  let workingDir = inputs.workingDir;
  let targetConfig = null;

  if (target) {
    targetConfig = lib.getTargetFromTargetGroups(config.target_groups, target);
    if (!targetConfig) {
      throw new Error("target config is not found in target_groups");
    }
    workingDir = target.replace(
      targetConfig.target,
      targetConfig.working_directory,
    );
  } else if (workingDir) {
    targetConfig = lib.getTargetFromTargetGroupsByWorkingDir(
      config.target_groups,
      workingDir,
    );
    if (!targetConfig) {
      throw new Error("target config is not found in target_groups");
    }
    target = workingDir.replace(
      targetConfig.working_directory,
      targetConfig.target,
    );
  } else {
    throw new Error(
      "Either TFACTION_TARGET or TFACTION_WORKING_DIR is required",
    );
  }

  const wdConfig = lib.readTargetConfig(
    path.join(workingDir, workingDirectoryFile),
  );

  const policyMap = new Map<string, lib.ConftestPolicyConfig>();
  const conftest = config.conftest ?? {};
  for (const policy of config.conftest?.policies ?? []) {
    if (policy.id) {
      policyMap.set(policy.id, policy);
    }
  }
  if (conftest.policies === undefined) {
    conftest.policies = [];
  }

  for (const cfg of [targetConfig, wdConfig]) {
    if (cfg.conftest?.disable_all) {
      for (const [key, value] of policyMap) {
        value.enabled = false;
        conftest.policies.push(value);
      }
      for (const policy of conftest.policies) {
        policy.enabled = false;
      }
    }
    for (const policy of cfg.conftest?.policies ?? []) {
      if (!policy.id) {
        conftest.policies.push(policy);
        continue;
      }
      const elem = policyMap.get(policy.id);
      if (!elem) {
        policyMap.set(policy.id, policy);
        continue;
      }
      Object.assign(elem, policy);
    }
  }
  const policies = [];
  for (const [key, value] of policyMap) {
    if (value.enabled !== false) {
      policies.push(value);
    }
  }
  for (const policy of conftest.policies) {
    if (policy.enabled !== false) {
      policies.push(policy);
    }
  }
  for (const policy of policies) {
  }
};
