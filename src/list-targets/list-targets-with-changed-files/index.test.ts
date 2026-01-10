import { run } from "./index";
import { expect, test } from "vitest";

test("normal", async () => {
  expect(
    await run({
      config: {
        plan_workflow_name: "plan.yaml",
        target_groups: [
          {
            target: "foo/",
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
        plan_workflow_name: "plan.yaml",
        target_groups: [
          {
            target: "foo/",
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
  target_groups: [
    {
      target: "foo/",
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
      target: "yoo/",
      working_directory: "yoo/services/",
      runs_on: "ubuntu-latest",
      environment: "yoo",
    },
    {
      target: "zoo/",
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
    {
      environment: "yoo",
      job_type: "terraform",
      runs_on: "ubuntu-latest",
      secrets: undefined,
      target: "yoo/dev",
      working_directory: "yoo/services/dev",
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
        plan_workflow_name: "plan.yaml",
        target_groups: [
          {
            target: "foo/",
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
        plan_workflow_name: "plan.yaml",
        target_groups: [
          {
            target: "foo/",
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
