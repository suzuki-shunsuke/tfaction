import * as core from "@actions/core";
import * as lib from "../lib";
import * as types from "../lib/types";
import { TargetConfig } from "../actions/get-target-config";
import * as aqua from "../aqua";
import * as path from "path";
import fs from "fs";
import tmp from "tmp";
import { globSync } from "glob";

type Inputs = {
  /** Absolute path to the git root directory */
  gitRootDir: string;
  githubToken: string;
  plan: boolean;
  planJsonPath?: string;
  executor: aqua.Executor;
};

const getConftestPaths = (
  policy: types.ConftestPolicyConfig,
  workingDir: string,
  planJsonPath?: string,
): string[] => {
  const paths: string[] = [];
  if (policy.tf) {
    // TODO support .tofu and .tofu.json if tfcommand is tofu
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
    if (planJsonPath) {
      paths.push(planJsonPath);
    } else {
      paths.push("tfplan.json");
    }
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
  return paths;
};

/**
 *
 * @param policy
 * @param target
 * @param workingDir A relative path from git_root_dir to a working directory
 * @param paths
 * @returns
 */
const buildConftestArgs = (
  policy: types.ConftestPolicyConfig,
  target: string,
  workingDir: string,
  paths: string[],
): string[] => {
  const args = [
    "exec",
    "-var",
    `tfaction_target:${target}`,
    "-k",
    "conftest",
    "--",
    "conftest",
    "test",
    "--no-color",
  ];

  if (typeof policy.policy === "string") {
    // workingDir: relative path from git_root_dir
    // policy.policy: relative path from git_root_dir
    // result: relative path from workingDir to policy
    args.push("-p", path.relative(workingDir, policy.policy));
  } else if (policy.policy) {
    for (const p of policy.policy) {
      args.push("-p", path.relative(workingDir, p));
    }
  }

  if (policy.combine) {
    args.push("--combine");
  }

  if (policy.data !== undefined) {
    if (typeof policy.data === "string") {
      args.push("--data", path.relative(workingDir, policy.data));
    } else {
      for (const p of policy.data) {
        args.push("--data", path.join(workingDir, p));
      }
    }
  }

  // create a special data file
  tmp.setGracefulCleanup();
  const tmpobj = tmp.dirSync();
  const data = {
    tfaction: {
      target: target,
      working_directory: workingDir,
    },
  };
  const tmpFile = path.join(tmpobj.name, "data.json");
  fs.writeFileSync(tmpFile, JSON.stringify(data));
  args.push("--data", tmpFile);

  if (policy.fail_on_warn) {
    args.push("--fail-on-warn");
  }
  if (policy.no_fail) {
    args.push("--no-fail");
  }
  if (policy.all_namespaces) {
    args.push("--all-namespaces");
  }
  if (policy.quiet) {
    args.push("--quiet");
  }
  if (policy.trace) {
    args.push("--trace");
  }
  if (policy.strict) {
    args.push("--strict");
  }
  if (policy.show_builtin_errors) {
    args.push("--show-builtin-errors");
  }
  if (policy.junit_hide_message) {
    args.push("--junit-hide-message");
  }
  if (policy.suppress_exceptions) {
    args.push("--suppress-exceptions");
  }
  if (policy.tls) {
    args.push("--tls");
  }
  if (policy.parser) {
    args.push("--parser", policy.parser);
  }
  if (policy.output) {
    args.push("--output", policy.output);
  }
  for (const n of policy.namespaces ?? []) {
    args.push("-n", n);
  }

  args.push(...paths);
  return args;
};

const buildPolicies = (
  config: types.Config,
  targetGroup: types.TargetGroup,
  wdConfig: types.TargetConfig,
  isPlan: boolean,
): types.ConftestPolicyConfig[] => {
  const policyMap = new Map<string, types.ConftestPolicyConfig>();

  if (!config.conftest) {
    return [];
  }

  const conftest = config.conftest;
  if (!conftest.policies || conftest.policies.length === 0) {
    return [];
  }

  for (const policy of conftest.policies) {
    if (policy.id) {
      policyMap.set(policy.id, policy);
    }
  }

  for (const cfg of [targetGroup, wdConfig]) {
    if (cfg.conftest?.disable_all) {
      for (const [, value] of policyMap) {
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

  const policies: types.ConftestPolicyConfig[] = [];
  for (const policy of conftest.policies.concat(...policyMap.values())) {
    if (policy.enabled !== false && isPlan === !!policy.plan) {
      policies.push(policy);
    }
  }

  return policies;
};

export const run = async (
  inputs: Inputs,
  config: types.Config,
  targetConfig: TargetConfig,
) => {
  const executor = inputs.executor;

  const workingDir = path.join(
    config.git_root_dir,
    targetConfig.working_directory,
  );
  const wdConfig = lib.readTargetConfig(
    path.join(workingDir, config.working_directory_file),
  );

  const policies = buildPolicies(config, targetConfig, wdConfig, inputs.plan);

  if (policies.length !== 0) {
    core.startGroup("conftest -v");
    await executor.exec(
      "github-comment",
      [
        "exec",
        "-var",
        `tfaction_target:${targetConfig.target}`,
        "--",
        "conftest",
        "-v",
      ],
      {
        cwd: workingDir,
        env: {
          GITHUB_TOKEN: inputs.githubToken,
          GH_COMMENT_CONFIG: lib.GitHubCommentConfig,
        },
      },
    );
    core.endGroup();
  }

  for (const policy of policies) {
    if (!policy.policy) {
      continue;
    }
    const paths = getConftestPaths(policy, workingDir, inputs.planJsonPath);
    const args = buildConftestArgs(
      policy,
      targetConfig.target,
      targetConfig.working_directory,
      paths,
    );
    core.startGroup("conftest");
    await executor.exec("github-comment", args, {
      cwd: workingDir,
      env: {
        GITHUB_TOKEN: inputs.githubToken,
        GH_COMMENT_CONFIG: lib.GitHubCommentConfig,
      },
    });
    core.endGroup();
  }
};
