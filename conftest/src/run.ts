import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as lib from "lib";
import * as path from "path";
import fs from "fs";
import { globSync } from "glob";

type Inputs = {
  target?: string;
  workingDir?: string;
  githubCommentConfig: string;
  rootDir: string;
  plan: boolean;
};

export const main = () => {
  run(
    {
      target: process.env.TFACTION_TARGET,
      workingDir: process.env.TFACTION_WORKING_DIR,
      githubCommentConfig: path.join(
        process.env.GITHUB_ACTION_PATH ?? "",
        "github-comment.yaml",
      ),
      rootDir: process.env.ROOT_DIR ?? "",
      plan: process.env.PLAN !== "false",
    },
    lib.getConfig(),
  );
};

export const run = async (inputs: Inputs, config: lib.Config) => {
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
    if (config.conftest_policy_directory) {
      conftest.policies.push({
        policy: config.conftest_policy_directory,
        plan: true,
      });
    } else {
      if (fs.existsSync("policy")) {
        conftest.policies.push({
          policy: "policy",
          plan: true,
        });
      }
    }
  }

  for (const cfg of [targetConfig, wdConfig]) {
    if (cfg.conftest?.disable_all) {
      for (const [key, value] of policyMap) {
        value.enabled = false;
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
  for (const policy of conftest.policies.concat(...policyMap.values())) {
    if (policy.enabled !== false && inputs.plan === !!policy.plan) {
      policies.push(policy);
    }
  }
  if (policies.length !== 0) {
    await exec.exec(
      "github-comment",
      [
        "exec",
        "-config",
        inputs.githubCommentConfig,
        "-var",
        `tfaction_target:${target}`,
        "--",
        "conftest",
        "-v",
      ],
      {
        cwd: workingDir,
      },
    );
  }
  for (const policy of policies) {
    if (!policy.policy) {
      continue;
    }
    core.info("Running conftest");
    const paths: string[] = [];
    if (policy.tf) {
      const tfFiles = globSync(path.join(workingDir, "*.tf"), {
        ignore: ".terraform/**",
      });
      const tfJSONFiles = globSync(path.join(workingDir, "*.tf.json"), {
        ignore: ".terraform/**",
      });
      for (const tfFile of tfFiles.concat(tfJSONFiles)) {
        paths.push(path.relative(workingDir, tfFile));
      }
    } else if (policy.plan) {
      paths.push("tfplan.json");
    } else if (policy.paths) {
      for (const p of policy.paths) {
        const files = globSync(path.join(workingDir, p), {
          ignore: ".terraform/**",
        });
        for (const file of files) {
          paths.push(path.relative(workingDir, file));
        }
      }
    }
    const args = [
      "exec",
      "-config",
      inputs.githubCommentConfig,
      "-var",
      `tfaction_target:${target}`,
      "-k",
      "conftest",
      "--",
      "conftest",
      "test",
      "--no-color",
      "-p",
      path.join(inputs.rootDir, policy.policy),
    ];
    if (policy.combine) {
      args.push("--combine");
    }
    if (policy.data) {
      args.push("--data", path.join(workingDir, policy.data));
    }
    args.push(...paths);
    core.info("github-comment " + args.join(" "));
    await exec.exec("github-comment", args, {
      cwd: workingDir,
    });
  }
};
