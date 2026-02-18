import { run } from "./index";
import { expect, test } from "vitest";

test("normal", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
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
            working_directory: "foo/**",
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
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
        skip_terraform: false,
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
      working_directory: "foo/**",
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
      working_directory: "yoo/services/**",
      runs_on: "ubuntu-latest",
      environment: "yoo",
    },
    {
      working_directory: "zoo/**",
    },
  ],
};

const prCommentExpected = {
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
      skip_terraform: false,
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual(prCommentExpected);
});

test("module callers", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
        target: "foo/bar",
        working_directory: "foo/bar",
      },
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
        target: "foo/baz",
        working_directory: "foo/baz",
      },
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
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
            working_directory: "foo/**",
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
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
            working_directory: "foo/**",
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "tfmigrate",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
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
            working_directory: "foo/**",
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "tfmigrate",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("module change detection without callers produces no targets", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
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
      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [],
  });
});

test("module callers triggered", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
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
      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
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
            working_directory: "services/**",
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
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
            working_directory: "foo/**",
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "tfmigrate",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("skip label sets skip_terraform", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
          },
        ],
      },
      isApply: false,
      labels: ["skip:foo/dev", "other-label"],
      changedFiles: ["foo/dev/main.tf", "foo/bar/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml", "foo/bar/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: true,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
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
            working_directory: "foo/**",
          },
        ],
        label_prefixes: {
          skip: "ignore:",
          tfmigrate: "tfmigrate:",
        },
      },
      isApply: false,
      labels: ["ignore:foo/dev"],
      changedFiles: ["foo/dev/main.tf", "foo/bar/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml", "foo/bar/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: true,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
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
            working_directory: "foo/**",
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
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
            working_directory: "foo/**",
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [],
  });
});

test("duplicate tfmigrate labels", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "tfmigrate",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
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
            working_directory: "foo/**",
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
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
            working_directory: "foo/**",
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
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
        skip_terraform: false,
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
            working_directory: "foo/**",
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: "production",
        job_type: "tfmigrate",
        runs_on: "self-hosted",
        secrets: undefined,
        skip_terraform: false,
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
            working_directory: "terraform/**",
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
      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
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
            working_directory: "aws/**",
            runs_on: "ubuntu-latest",
          },
          {
            working_directory: "gcp/**",
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
        target: "aws/dev",
        working_directory: "aws/dev",
      },
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "macos-latest",
        secrets: undefined,
        skip_terraform: false,
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
            working_directory: "foo/**",
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
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
        skip_terraform: false,
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
            working_directory: "foo/**",
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: "production",
        job_type: "terraform",
        runs_on: "production-runner",
        secrets: undefined,
        skip_terraform: false,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("multiple modules changed without callers produces no targets", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "terraform/**",
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
      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [],
  });
});

test("template_dir config files are excluded", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "aws/**",
            template_dir: "templates/aws",
          },
        ],
      },
      isApply: false,
      labels: [],
      changedFiles: ["aws/dev/main.tf", "templates/aws/dev/main.tf"],
      configFiles: ["aws/dev/tfaction.yaml", "templates/aws/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
        target: "aws/dev",
        working_directory: "aws/dev",
      },
    ],
  });
});

test("template_dir with trailing slash", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "aws/**",
            template_dir: "templates/aws/",
          },
        ],
      },
      isApply: false,
      labels: [],
      changedFiles: ["aws/dev/main.tf"],
      configFiles: ["aws/dev/tfaction.yaml", "templates/aws/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
        target: "aws/dev",
        working_directory: "aws/dev",
      },
    ],
  });
});

test("runs_on as array", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
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

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: ["self-hosted", "linux", "x64"],
        secrets: undefined,
        skip_terraform: false,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

// skip_terraform_files tests

test("skip_terraform_files: all files match patterns", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
          },
        ],
        skip_terraform_files: ["*.lock.hcl", "*.md"],
      },
      isApply: false,
      labels: [],
      changedFiles: ["foo/dev/.terraform.lock.hcl", "foo/dev/README.md"],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: true,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("skip_terraform_files: some files don't match", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
          },
        ],
        skip_terraform_files: ["*.lock.hcl"],
      },
      isApply: false,
      labels: [],
      changedFiles: ["foo/dev/.terraform.lock.hcl", "foo/dev/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("skip_terraform_files: not configured", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
          },
        ],
      },
      isApply: false,
      labels: [],
      changedFiles: ["foo/dev/.terraform.lock.hcl"],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("skip_terraform_files: module files don't match patterns", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
          },
        ],
        skip_terraform_files: ["*.lock.hcl"],
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
      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("skip_terraform_files: module files all match patterns", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
          },
        ],
        skip_terraform_files: ["*.lock.hcl"],
      },
      isApply: false,
      labels: [],
      changedFiles: ["modules/vpc/.terraform.lock.hcl"],
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
      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: true,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("skip_terraform_files: multiple patterns", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
          },
        ],
        skip_terraform_files: ["*.lock.hcl", "*.md", "*.txt"],
      },
      isApply: false,
      labels: [],
      changedFiles: [
        "foo/dev/.terraform.lock.hcl",
        "foo/dev/README.md",
        "foo/dev/notes.txt",
      ],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},

      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: true,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("module detected via moduleWorkingDirs gets type: module", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "modules/**",
          },
        ],
      },
      isApply: false,
      labels: [],
      changedFiles: ["modules/vpc/main.tf"],
      configFiles: ["modules/vpc/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},

      moduleWorkingDirs: new Set(["modules/vpc"]),
      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
        target: "modules/vpc",
        working_directory: "modules/vpc",
        type: "module",
      },
    ],
  });
});

test("mixed modules and regular working dirs", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
          },
          {
            working_directory: "modules/**",
          },
        ],
      },
      isApply: false,
      labels: [],
      changedFiles: ["foo/dev/main.tf", "modules/vpc/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml", "modules/vpc/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},

      moduleWorkingDirs: new Set(["modules/vpc"]),
      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
        target: "modules/vpc",
        working_directory: "modules/vpc",
        type: "module",
      },
    ],
  });
});

test("isApply filters out module type from targetConfigs", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
          },
          {
            working_directory: "modules/**",
          },
        ],
      },
      isApply: true,
      labels: [],
      changedFiles: ["foo/dev/main.tf", "modules/vpc/main.tf"],
      configFiles: ["foo/dev/tfaction.yaml", "modules/vpc/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},

      moduleWorkingDirs: new Set(["modules/vpc"]),
      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("module working dir with no changes produces no output", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "modules/**",
          },
        ],
      },
      isApply: false,
      labels: [],
      changedFiles: [],
      configFiles: ["modules/vpc/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},

      moduleWorkingDirs: new Set(["modules/vpc"]),
      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
    }),
  ).toStrictEqual({
    targetConfigs: [],
  });
});

// test_workflow tests

test("test_workflow: changed_files match and no working dirs changed adds test targets", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
          },
        ],
        test_workflow: {
          working_directories: ["foo/dev"],
          changed_files: [".github/workflows/*.yaml"],
        },
      },
      isApply: false,
      labels: [],
      changedFiles: [],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
      relativeChangedFiles: [".github/workflows/plan.yaml"],
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("test_workflow: changed_files match but working dirs also changed returns normal targets", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
          },
        ],
        test_workflow: {
          working_directories: ["foo/dev"],
          changed_files: [".github/workflows/*.yaml"],
        },
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
      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
      relativeChangedFiles: [".github/workflows/plan.yaml", "foo/dev/main.tf"],
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});

test("test_workflow: changed_files don't match and no working dirs changed returns no targets", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
          },
        ],
        test_workflow: {
          working_directories: ["foo/dev"],
          changed_files: [".github/workflows/*.yaml"],
        },
      },
      isApply: false,
      labels: [],
      changedFiles: [],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
      relativeChangedFiles: ["README.md"],
    }),
  ).toStrictEqual({
    targetConfigs: [],
  });
});

test("test_workflow: apply mode includes test targets", async () => {
  expect(
    await run({
      config: {
        target_groups: [
          {
            working_directory: "foo/**",
          },
        ],
        test_workflow: {
          working_directories: ["foo/dev"],
          changed_files: [".github/workflows/*.yaml"],
        },
      },
      isApply: true,
      labels: [],
      changedFiles: [],
      configFiles: ["foo/dev/tfaction.yaml"],
      prBody: "",
      payload: {
        pull_request: {
          body: "",
        },
      },
      moduleCallers: {},
      octokit: {} as ReturnType<typeof import("@actions/github").getOctokit>,
      prNumber: 0,
      maxChangedWorkingDirectories: 0,
      relativeChangedFiles: [".github/workflows/plan.yaml"],
    }),
  ).toStrictEqual({
    targetConfigs: [
      {
        environment: undefined,
        job_type: "terraform",
        runs_on: "ubuntu-latest",
        secrets: undefined,
        skip_terraform: false,
        target: "foo/dev",
        working_directory: "foo/dev",
      },
    ],
  });
});
