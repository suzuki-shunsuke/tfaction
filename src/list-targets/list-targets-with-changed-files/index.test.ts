import { run } from "./index";
import { expect, test } from "vitest";

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
      pr: "",
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
      pr: "",
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
      pr: "",
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
      pr: "",
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
      pr: "",
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
      pr: "",
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
      pr: "",
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
      pr: "",
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
      pr: "",
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
      pr: "",
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
      pr: "",
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
        },
      },
      isApply: false,
      labels: ["migrate:foo/dev"],
      changedFiles: [],
      configFiles: ["foo/dev/tfaction.yaml"],
      pr: "",
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
      pr: "",
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
        },
      },
      isApply: false,
      labels: ["ignore:foo/dev"],
      changedFiles: ["foo/bar/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml", "foo/bar/tfaction.yaml"],
      pr: "",
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
      pr: "",
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
    }),
  ).rejects.toThrow("No working directory is found for the target unknown/target");
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
      pr: "",
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
      pr: "",
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
