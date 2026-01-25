import { run } from "./index";
import { expect, test } from "vitest";
import * as aqua from "../../../aqua";

test("normal", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
          },
        ],
      },
      isApply: false,
      labels: [],
      changedFiles: ["foo/dev/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "hello",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("job config", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
            runs_on: "macos-latest",
            secrets: [
              {
                env_name: "GH_TOKEN",
                secret_name: "GH_TOKEN",
              },
            ],
            environment: "dev",
          },
        ],
      },
      isApply: false,
      labels: [],
      changedFiles: ["foo/dev/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "hello",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [
      {
        environment: "dev",
        job_type: "terraform",
        runs_on: "macos-latest",
        secrets: [
          {
            env_name: "GH_TOKEN",
            secret_name: "GH_TOKEN",
          },
        ],
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

const prCommentConfig = {
  plan_workflow_name: "plan.yaml",
  replace_target: {
    patterns: [
      {
        regexp: "^yoo/services/",
        replace: "yoo/",
      },
    ],
  },
  target_groups: [
    {
      working_directory: "foo/",
      runs_on: "macos-latest",
      secrets: [
        {
          env_name: "GH_TOKEN",
          secret_name: "GH_TOKEN",
        },
      ],
      environment: "dev",
    },
    {
      working_directory: "yoo/services/",
      runs_on: "ubuntu-latest",
      environment: "yoo",
    },
    {
      working_directory: "zoo/",
    },
  ],
};

const prCommentExpected = {
  modules: [],
  targetConfigs: [
    {
      environment: "dev",
      job_type: "terraform",
      runs_on: "macos-latest",
      secrets: [
        {
          env_name: "GH_TOKEN",
          secret_name: "GH_TOKEN",
        },
      ],
      target: "foo/dev",
      working_directory: "foo/dev",
    },
  ],
};

test("pr comment", async () => {
  expect(
    await run({
      config: prCommentConfig,
      isApply: false,
      labels: [],
      changedFiles: ["foo/dev/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml", "yoo/services/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "<!-- tfaction follow up pr target=yoo/dev -->",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual(prCommentExpected);
});

test("pr comment with updated body", async () => {
  expect(
    await run({
      config: prCommentConfig,
      isApply: false,
      labels: [],
      changedFiles: ["foo/dev/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml", "yoo/services/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: `first line is added
<!-- tfaction follow up pr target=yoo/dev
-->`,
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual(prCommentExpected);
});

test("module callers", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
          },
        ],
      },
      isApply: false,
      labels: [],
      changedFiles: ["foo/dev/main.tf"],
      configFiles: [
        "foo/dev/tfaction.yaml",
        "foo/bar/tfaction.yaml",
        "foo/baz/tfaction.yaml",
      ],
      prBody: "",
      payload: {
        pull_request: {
          body: "hello",
        },
      },
      moduleCallers: {
        // dev calls bar and baz
        "foo/dev": ["foo/bar", "foo/baz"],
      },
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        target: "foo/bar",
        working_directory: "foo/bar",
      },
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        target: "foo/baz",
        working_directory: "foo/baz",
      },
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("nest", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
          },
        ],
      },
      isApply: false,
      labels: [],
      changedFiles: ["foo/dev/bar/main.tf"],
      configFiles: ["foo/tfaction.yaml", "foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "hello",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("tfmigrate label", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
          },
        ],
      },
      isApply: false,
      labels: ["tfmigrate:foo/dev"],
      changedFiles: [],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [
      {
        environment: undefined,
        job_type: "tfmigrate",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("tfmigrate label with changed files", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
          },
        ],
      },
      isApply: false,
      labels: ["tfmigrate:foo/dev"],
      changedFiles: ["foo/dev/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [
      {
        environment: undefined,
        job_type: "tfmigrate",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("module change detection", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
          },
        ],
      },
      isApply: false,
      labels: [],
      changedFiles: ["modules/vpc/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      moduleFiles: ["modules/vpc/tfaction_module.yaml"],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: ["modules/vpc"],
    targetConfigs: [],
  });
});

test("module callers triggered", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
          },
        ],
      },
      isApply: false,
      labels: [],
      changedFiles: ["modules/vpc/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {
        "modules/vpc": ["foo/dev"],
      },
      moduleFiles: ["modules/vpc/tfaction_module.yaml"],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: ["modules/vpc"],
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("replace_target", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "services/",
          },
        ],
        replace_target: {
          patterns: [
            {
              regexp: "^services/",
              replace: "",
            },
          ],
        },
      },
      isApply: false,
      labels: [],
      changedFiles: ["services/app/dev/main.tf"],
      configFiles: ["services/app/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        target: "app/dev",
        working_directory: "services/app/dev",
      },
    ],
  });
});

test("custom label prefixes for tfmigrate", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
          },
        ],
        label_prefixes: {
          tfmigrate: "migrate:",
          skip: "skip:",
        },
      },
      isApply: false,
      labels: ["migrate:foo/dev"],
      changedFiles: [],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [
      {
        environment: undefined,
        job_type: "tfmigrate",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("skip label parses correctly", async () => {
  // Note: skip labels are parsed but don't filter targets in current implementation
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
          },
        ],
      },
      isApply: false,
      labels: ["skip:foo/dev", "other-label"],
      changedFiles: ["foo/bar/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml", "foo/bar/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        target: "foo/bar",
        working_directory: "foo/bar",
      },
    ],
  });
});

test("custom skip label prefix", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
          },
        ],
        label_prefixes: {
          skip: "ignore:",
          tfmigrate: "tfmigrate:",
        },
      },
      isApply: false,
      labels: ["ignore:foo/dev"],
      changedFiles: ["foo/bar/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml", "foo/bar/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        target: "foo/bar",
        working_directory: "foo/bar",
      },
    ],
  });
});

test("tfmigrate label with unknown target throws error", async () => {
  await expect(
    run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
          },
        ],
      },
      isApply: false,
      labels: ["tfmigrate:unknown/target"],
      changedFiles: [],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).rejects.toThrow(
    "No working directory is found for the target unknown/target",
  );
});

test("empty labels and changed files", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
          },
        ],
      },
      isApply: false,
      labels: ["", ""],
      changedFiles: ["", ""],
      configFiles: ["foo/dev/tfaction.yaml", ""],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [],
  });
});

test("duplicate tfmigrate labels", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
          },
        ],
      },
      isApply: false,
      labels: ["tfmigrate:foo/dev", "tfmigrate:foo/dev"],
      changedFiles: [],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [
      {
        environment: undefined,
        job_type: "tfmigrate",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("isApply mode", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
          },
        ],
      },
      isApply: true,
      labels: [],
      changedFiles: ["foo/dev/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("tfmigrate with job config", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
            runs_on: "ubuntu-latest",
            tfmigrate_plan_config: {
              runs_on: "macos-latest",
              environment: "tfmigrate-env",
              secrets: [
                {
                  env_name: "TFMIGRATE_TOKEN",
                  secret_name: "TFMIGRATE_SECRET",
                },
              ],
            },
          },
        ],
      },
      isApply: false,
      labels: ["tfmigrate:foo/dev"],
      changedFiles: [],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [
      {
        environment: "tfmigrate-env",
        job_type: "tfmigrate",
        runs_on: "macos-latest",
        secrets: [
          {
            env_name: "TFMIGRATE_TOKEN",
            secret_name: "TFMIGRATE_SECRET",
          },
        ],
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("tfmigrate apply with job config", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
            runs_on: "ubuntu-latest",
            tfmigrate_apply_config: {
              runs_on: "self-hosted",
              environment: "production",
            },
          },
        ],
      },
      isApply: true,
      labels: ["tfmigrate:foo/dev"],
      changedFiles: [],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [
      {
        environment: "production",
        job_type: "tfmigrate",
        runs_on: "self-hosted",
        secrets: undefined,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("module caller is also a module", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "terraform/",
          },
        ],
      },
      isApply: false,
      labels: [],
      changedFiles: ["modules/base/main.tf"],
      configFiles: ["terraform/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {
        "modules/base": ["modules/vpc", "terraform/dev"],
      },
      moduleFiles: [
        "modules/base/tfaction_module.yaml",
        "modules/vpc/tfaction_module.yaml",
      ],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: ["modules/vpc", "modules/base"],
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        target: "terraform/dev",
        working_directory: "terraform/dev",
      },
    ],
  });
});

test("multiple target groups", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "aws/",
            runs_on: "ubuntu-latest",
          },
          {
            working_directory: "gcp/",
            runs_on: "macos-latest",
          },
        ],
      },
      isApply: false,
      labels: [],
      changedFiles: ["aws/dev/main.tf", "gcp/prod/main.tf"],
      configFiles: ["aws/dev/tfaction.yaml", "gcp/prod/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        target: "aws/dev",
        working_directory: "aws/dev",
      },
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "macos-latest",
        secrets: undefined,
        target: "gcp/prod",
        working_directory: "gcp/prod",
      },
    ],
  });
});

test("terraform plan job config", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
            runs_on: "ubuntu-latest",
            terraform_plan_config: {
              runs_on: "self-hosted",
              environment: "plan-env",
              secrets: [
                {
                  env_name: "PLAN_TOKEN",
                  secret_name: "PLAN_SECRET",
                },
              ],
            },
          },
        ],
      },
      isApply: false,
      labels: [],
      changedFiles: ["foo/dev/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [
      {
        environment: "plan-env",
        job_type: "terraform",
        runs_on: "self-hosted",
        secrets: [
          {
            env_name: "PLAN_TOKEN",
            secret_name: "PLAN_SECRET",
          },
        ],
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("terraform apply job config", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
            runs_on: "ubuntu-latest",
            terraform_apply_config: {
              runs_on: "production-runner",
              environment: "production",
            },
          },
        ],
      },
      isApply: true,
      labels: [],
      changedFiles: ["foo/dev/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [
      {
        environment: "production",
        job_type: "terraform",
        runs_on: "production-runner",
        secrets: undefined,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("multiple modules changed", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "terraform/",
          },
        ],
      },
      isApply: false,
      labels: [],
      changedFiles: ["modules/vpc/main.tf", "modules/iam/main.tf"],
      configFiles: ["terraform/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      moduleFiles: [
        "modules/vpc/tfaction_module.yaml",
        "modules/iam/tfaction_module.yaml",
      ],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: ["modules/vpc", "modules/iam"],
    targetConfigs: [],
  });
});

test("runs_on as array", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/",
            runs_on: ["self-hosted", "linux", "x64"],
          },
        ],
      },
      isApply: false,
      labels: [],
      changedFiles: ["foo/dev/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      moduleFiles: [],
      githubToken: "xxx",
      maxChangedWorkingDirectories: 0,
      maxChangedModules: 0,
      executor: await aqua.NewExecutor({}),
    }),
  ).toStrictEqual({
    modules: [],
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: ["self-hosted", "linux", "x64"],
        secrets: undefined,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});
