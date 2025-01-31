import * as core from '@actions/core';
import * as exec from "@actions/exec";
import * as lib from "../lib";
import * as path from "path";
import fs from "fs";
import tmp from "tmp";
import { globSync } from "glob";

type Inputs = {
  workingDir?: string;
  target?: string;
  rootDir: string;
  githubToken: string;
  plan: boolean;
};

export const main = async () => {
  run(
    {
      workingDir: process.env.TFACTION_WORKING_DIR,
      target: process.env.TFACTION_TARGET,
      rootDir: process.env.GITHUB_WORKSPACE ?? "",
      plan: core.getBooleanInput("plan", { required: true }),
      githubToken: core.getInput("github_token", { required: true }),
    },
    lib.getConfig(),
  );
};

const run = async (inputs: Inputs, config: lib.Config) => {
  const workingDirectoryFile = config.working_directory_file ?? "tfaction.yaml";

  const t = await lib.getTargetGroup(config, inputs.target, inputs.workingDir);

  if (!t.group) {
    throw new Error("target config is not found in target_groups");
  }

  const wdConfig = lib.readTargetConfig(
    path.join(t.workingDir, workingDirectoryFile),
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

  for (const cfg of [t.group, wdConfig]) {
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
      ["exec", "-var", `tfaction_target:${t.target}`, "--", "conftest", "-v"],
      {
        cwd: t.workingDir,
        env: {
          ...process.env,
          GITHUB_TOKEN: inputs.githubToken,
        },
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
      const tfFiles = globSync(path.join(t.workingDir, "*.tf"), {
        ignore: ".terraform/**",
      });
      const tfJSONFiles = globSync(path.join(t.workingDir, "*.tf.json"), {
        ignore: ".terraform/**",
      });
      for (const tfFile of tfFiles.concat(tfJSONFiles)) {
        paths.push(path.relative(t.workingDir, tfFile));
      }
    } else if (policy.plan) {
      paths.push("tfplan.json");
    } else if (policy.paths) {
      for (const p of policy.paths) {
        const files = globSync(path.join(t.workingDir, p), {
          ignore: ".terraform/**",
        });
        for (const file of files) {
          paths.push(path.relative(t.workingDir, file));
        }
      }
    }
    const args = [
      "exec",
      "-var",
      `tfaction_target:${t.target}`,
      "-k",
      "conftest",
      "--",
      "conftest",
      "test",
      "--no-color",
    ];

    if (typeof policy.policy === "string") {
      args.push("-p", path.join(inputs.rootDir, policy.policy));
    } else {
      for (const p of policy.policy) {
        args.push("-p", path.join(inputs.rootDir, p));
      }
    }

    if (policy.combine) {
      args.push("--combine");
    }

    if (policy.data !== undefined) {
      if (typeof policy.data === "string") {
        args.push("--data", path.join(inputs.rootDir, policy.data));
      } else {
        for (const p of policy.data) {
          args.push("--data", path.join(inputs.rootDir, p));
        }
      }
    }

    // create a special data file
    tmp.setGracefulCleanup();
    const tmpobj = tmp.dirSync();
    const data = {
      tfaction: {
        target: t.target,
        working_directory: t.workingDir,
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
    // if (policy.ignore) {
    //   args.push("--ignore", policy.ignore);
    // }
    if (policy.parser) {
      args.push("--parser", policy.parser);
    }
    // if (policy.capabilities) {
    //   args.push("--capabilities", policy.capabilities);
    // }
    if (policy.output) {
      args.push("--output", policy.output);
    }
    for (const n of policy.namespaces ?? []) {
      args.push("-n", n);
    }
    // for (const n of policy.proto_file_dirs ?? []) {
    //   args.push("--proto-file-dirs", n);
    // }

    args.push(...paths);
    core.info("github-comment " + args.join(" "));
    await exec.exec("github-comment", args, {
      cwd: t.workingDir,
      env: {
        ...process.env,
        GITHUB_TOKEN: inputs.githubToken,
      },
    });
  }
};
