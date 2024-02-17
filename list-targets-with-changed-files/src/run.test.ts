import { run } from "./run";

test("normal", () => {
  expect(
    run({
      config: {
        plan_workflow_name: "plan",
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
      module_callers: {},
    }),
  ).toStrictEqual([
    {
      environment: undefined,
      job_type: "terraform",
      runs_on: "ubuntu-latest",
      secrets: undefined,
      target: "foo/dev",
    },
  ]);
});

test("job config", () => {
  expect(
    run({
      config: {
        plan_workflow_name: "plan",
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
      module_callers: {},
    }),
  ).toStrictEqual([
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
    },
  ]);
});

test("pr comment", () => {
  expect(
    run({
      config: {
        plan_workflow_name: "plan",
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
      },
      isApply: false,
      labels: [],
      changedFiles: ["foo/dev/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml"],
      pr: "",
      payload: {
        pull_request: {
          body: "<!-- tfaction follow up pr target=yoo/dev -->",
        },
      },
      module_callers: {},
    }),
  ).toStrictEqual([
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
    },
    {
      environment: "yoo",
      job_type: "terraform",
      runs_on: "ubuntu-latest",
      secrets: undefined,
      target: "yoo/dev",
    },
  ]);
});

test("module callers", () => {
    expect(
        run({
            config: {
                plan_workflow_name: "plan",
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
            module_callers: {
              // dev calls bar and baz
              "foo/dev": ["foo/bar", "foo/baz"],
            },
        }),
    ).toStrictEqual([
        {
            environment: undefined,
            job_type: "terraform",
            runs_on: "ubuntu-latest",
            secrets: undefined,
            target: "foo/dev",
        },
        {
            environment: undefined,
            job_type: "terraform",
            runs_on: "ubuntu-latest",
            secrets: undefined,
            target: "foo/bar",
        },
        {
            environment: undefined,
            job_type: "terraform",
            runs_on: "ubuntu-latest",
            secrets: undefined,
            target: "foo/baz",
        },
    ]);
});