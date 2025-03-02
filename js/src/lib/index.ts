import * as fs from "fs";
import * as path from "path";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as github from "@actions/github";
import { load } from "js-yaml";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const GitHubEnvironment = z.union([
  z.string(),
  z.object({
    name: z.string(),
    url: z.string(),
  }),
]);

export type GitHubEnvironment = z.infer<typeof GitHubEnvironment>;

const JobType = z.union([
  z.literal("terraform"),
  z.literal("tfmigrate"),
  z.literal("scaffold_working_dir"),
]);

export type JobType = z.infer<typeof JobType>;

export const getJobType = (): JobType => {
  if (process.env.TFACTION_JOB_TYPE === undefined) {
    throw new Error("environment variable TFACTION_JOB_TYPE is required");
  }
  return JobType.parse(process.env.TFACTION_JOB_TYPE);
};

const TfsecConfig = z.object({
  enabled: z.optional(z.boolean()),
});

export type TfsecConfig = z.infer<typeof TfsecConfig>;

const TflintConfig = z.object({
  enabled: z.optional(z.boolean()),
  fix: z.optional(z.boolean()),
});

export type TflintConfig = z.infer<typeof TflintConfig>;

const TrivyConfig = z.object({
  enabled: z.optional(z.boolean()),
});

export type TrivyConfig = z.infer<typeof TrivyConfig>;

const TerraformDocsConfig = z.object({
  enabled: z.optional(z.boolean()),
});

export type TerraformDocsConfig = z.infer<typeof TerraformDocsConfig>;

const ConftestPolicyConfig = z.object({
  tf: z.optional(z.boolean()),
  plan: z.optional(z.boolean()),
  id: z.optional(z.string()),
  enabled: z.optional(z.boolean()),
  policy: z.union([z.string(), z.array(z.string())]),
  data: z.optional(z.union([z.string(), z.array(z.string())])),
  fail_on_warn: z.optional(z.boolean()),
  no_fail: z.optional(z.boolean()),
  all_namespaces: z.optional(z.boolean()),
  quiet: z.optional(z.boolean()),
  trace: z.optional(z.boolean()),
  strict: z.optional(z.boolean()),
  show_builtin_errors: z.optional(z.boolean()),
  junit_hide_message: z.optional(z.boolean()),
  suppress_exceptions: z.optional(z.boolean()),
  combine: z.optional(z.boolean()),
  tls: z.optional(z.boolean()),
  ignore: z.optional(z.string()),
  parser: z.optional(z.string()),
  capabilities: z.optional(z.string()),
  output: z.optional(z.string()),
  namespaces: z.optional(z.array(z.string())),
  proto_file_dirs: z.optional(z.array(z.string())),
  paths: z.optional(z.array(z.string())),
});

export type ConftestPolicyConfig = z.infer<typeof ConftestPolicyConfig>;

const ConftestConfig = z.object({
  disable_all: z.optional(z.boolean()),
  policies: z.optional(z.array(ConftestPolicyConfig)),
});

export type ConftestConfig = z.infer<typeof ConftestConfig>;

const GitHubSecrets = z.array(
  z.object({
    env_name: z.string(),
    secret_name: z.string(),
  }),
);

export type GitHubSecrets = z.infer<typeof GitHubSecrets>;

const AWSSecretsManagerSecretEnv = z.object({
  env_name: z.string(),
  secret_key: z.optional(z.string()),
});

export type AWSSecretsManagerSecretEnv = z.infer<
  typeof AWSSecretsManagerSecretEnv
>;

const AWSSecretsManagerSecret = z.object({
  envs: z.array(AWSSecretsManagerSecretEnv),
  secret_id: z.string(),
  version_id: z.optional(z.string()),
  version_stage: z.optional(z.string()),
  aws_region: z.optional(z.string()),
});

export type AWSSecretsManagerSecret = z.infer<typeof AWSSecretsManagerSecret>;

const JobConfig = z.object({
  aws_assume_role_arn: z.optional(z.string()),
  aws_role_session_name: z.optional(z.string()),
  gcp_service_account: z.optional(z.string()),
  gcp_workload_identity_provider: z.optional(z.string()),
  gcp_access_token_scopes: z.optional(z.string()),
  gcp_remote_backend_service_account: z.optional(z.string()),
  gcp_remote_backend_workload_identity_provider: z.optional(z.string()),
  environment: z.optional(GitHubEnvironment),
  secrets: z.optional(GitHubSecrets),
  runs_on: z.optional(z.union([z.string(), z.array(z.string())])),
  env: z.optional(z.record(z.string())),
  aws_secrets_manager: z.optional(z.array(AWSSecretsManagerSecret)),
});

export type JobConfig = z.infer<typeof JobConfig>;

const TargetGroup = z.object({
  aws_region: z.optional(z.string()),
  aws_assume_role_arn: z.optional(z.string()),
  aws_role_session_name: z.optional(z.string()),
  destroy: z.optional(z.boolean()),
  env: z.optional(z.record(z.string())),
  environment: z.optional(GitHubEnvironment),
  gcp_service_account: z.optional(z.string()),
  gcp_workload_identity_provider: z.optional(z.string()),
  gcp_remote_backend_service_account: z.optional(z.string()),
  gcp_remote_backend_workload_identity_provider: z.optional(z.string()),
  gcs_bucket_name_tfmigrate_history: z.optional(z.string()),
  runs_on: z.optional(z.union([z.string(), z.array(z.string())])),
  secrets: z.optional(GitHubSecrets),
  s3_bucket_name_tfmigrate_history: z.optional(z.string()),
  target: z.optional(z.string()),
  template_dir: z.optional(z.string()),
  terraform_apply_config: z.optional(JobConfig),
  terraform_plan_config: z.optional(JobConfig),
  tfmigrate_apply_config: z.optional(JobConfig),
  tfmigrate_plan_config: z.optional(JobConfig),
  working_directory: z.string(),
  aws_secrets_manager: z.optional(z.array(AWSSecretsManagerSecret)),
  terraform_command: z.optional(z.string()),
  conftest: z.optional(ConftestConfig),
  drift_detection: z.optional(
    z.object({
      enabled: z.optional(z.boolean()),
    }),
  ),
});

export type TargetGroup = z.infer<typeof TargetGroup>;

const TargetConfig = z.object({
  aws_assume_role_arn: z.optional(z.string()),
  aws_region: z.optional(z.string()),
  destroy: z.optional(z.boolean()),
  drift_detection: z.optional(
    z.object({
      enabled: z.optional(z.boolean()),
    }),
  ),
  env: z.optional(z.record(z.string())),
  gcs_bucket_name_tfmigrate_history: z.optional(z.string()),
  gcp_service_account: z.optional(z.string()),
  gcp_workload_identity_provider: z.optional(z.string()),
  providers_lock_opts: z.optional(z.string()),
  s3_bucket_name_tfmigrate_history: z.optional(z.string()),
  secrets: z.optional(GitHubSecrets),
  terraform_apply_config: z.optional(JobConfig),
  terraform_plan_config: z.optional(JobConfig),
  tfmigrate_apply_config: z.optional(JobConfig),
  tfmigrate_plan_config: z.optional(JobConfig),
  terraform_command: z.optional(z.string()),
  terraform_docs: z.optional(TerraformDocsConfig),
  conftest: z.optional(ConftestConfig),
});

export type TargetConfig = z.infer<typeof TargetConfig>;

const Replace = z.object({
  patterns: z.array(
    z.object({
      regexp: z.string(),
      replace: z.string(),
      flags: z.optional(z.string()),
    }),
  ),
});

export type Replace = z.infer<typeof Replace>;

const Config = z.object({
  aqua: z.optional(
    z.object({
      update_checksum: z.optional(
        z.object({
          enabled: z.optional(z.boolean()),
          skip_push: z.optional(z.boolean()),
          prune: z.optional(z.boolean()),
        }),
      ),
    }),
  ),
  base_working_directory: z.optional(z.string()),
  conftest_policy_directory: z.optional(z.string()),
  conftest: z.optional(ConftestConfig),
  draft_pr: z.optional(z.boolean()),
  drift_detection: z.optional(
    z.object({
      issue_repo_owner: z.optional(z.string()),
      issue_repo_name: z.optional(z.string()),
      num_of_issues: z.optional(z.number()),
      minimum_detection_interval: z.optional(z.number()),
      enabled: z.optional(z.boolean()),
    }),
  ),
  env: z.optional(z.record(z.string())),
  label_prefixes: z.optional(
    z.object({
      target: z.optional(z.string()),
      tfmigrate: z.optional(z.string()),
      skip: z.optional(z.string()),
    }),
  ),
  module_base_directory: z.optional(z.string()),
  module_file: z.optional(z.string()),
  plan_workflow_name: z.string(),
  renovate_login: z.optional(z.string()),
  renovate_terraform_labels: z.optional(z.array(z.string())),
  scaffold_working_directory: z.optional(
    z.object({
      skip_adding_aqua_packages: z.optional(z.boolean()),
    }),
  ),
  skip_create_pr: z.optional(z.boolean()),
  skip_terraform_by_renovate: z.optional(z.boolean()),
  target_groups: z.array(TargetGroup),
  tflint: z.optional(TflintConfig),
  tfsec: z.optional(TfsecConfig),
  trivy: z.optional(TrivyConfig),
  terraform_docs: z.optional(TerraformDocsConfig),
  update_local_path_module_caller: z.optional(
    z.object({
      enabled: z.optional(z.boolean()),
    }),
  ),
  terraform_command: z.optional(z.string()),
  update_related_pull_requests: z.optional(
    z.object({
      enabled: z.optional(z.boolean()),
    }),
  ),
  working_directory_file: z.optional(z.string()),
  replace: z.optional(Replace),
});

export type Config = z.infer<typeof Config>;

export const generateJSONSchema = (dir: string) => {
  const configJSONSchema = zodToJsonSchema(Config, "config");
  fs.writeFileSync(path.join(dir, "tfaction-root.json"), JSON.stringify(configJSONSchema, null, 2));

  const targetConfigJSONSchema = zodToJsonSchema(TargetConfig, "config");
  fs.writeFileSync(path.join(dir, "tfaction.json"), JSON.stringify(targetConfigJSONSchema, null, 2));
};

export const getConfig = (): Config => {
  let configFilePath = process.env.TFACTION_CONFIG;
  if (!configFilePath) {
    configFilePath = "tfaction-root.yaml";
  }
  return Config.parse(load(fs.readFileSync(configFilePath, "utf8")));
};

export const createWDTargetMap = (
  wds: string[],
  config: Config,
): Map<string, string> => {
  const m = new Map<string, string>();
  for (const wd of wds) {
    let target = wd;
    for (const tg of config.target_groups) {
      if (!wd.startsWith(tg.working_directory)) {
        continue;
      }
      if (tg.target !== undefined) {
        target = tg.target + wd.slice(tg.working_directory.length);
      }
      for (const pattern of config.replace?.patterns ?? []) {
        target = target.replace(
          new RegExp(pattern.regexp, pattern.flags),
          pattern.replace,
        );
      }
      break;
    }
    m.set(wd, target);
  }
  return m;
};

export const getTarget = (): string | undefined => {
  return process.env.TFACTION_TARGET;
};

export const getWorkingDir = (): string | undefined => {
  return process.env.TFACTION_WORKING_DIR;
};

export const getIsApply = (): boolean => {
  return process.env.TFACTION_IS_APPLY === "true";
};

export const getTargetFromTargetGroupsByWorkingDir = (
  targetGroups: Array<TargetGroup>,
  wd: string,
): TargetGroup | undefined => {
  for (const targetConfig of targetGroups) {
    if (wd.startsWith(targetConfig.working_directory)) {
      return targetConfig;
    }
  }
  return undefined;
};

export const readTargetConfig = (p: string): TargetConfig => {
  return TargetConfig.parse(load(fs.readFileSync(p, "utf8")));
};

export const getJobConfig = (
  config: TargetConfig | undefined,
  isApply: boolean,
  jobType: JobType,
): JobConfig | undefined => {
  if (config == undefined) {
    return undefined;
  }
  if (isApply) {
    switch (jobType) {
      case "terraform":
        return config.terraform_apply_config;
      case "tfmigrate":
        return config.tfmigrate_apply_config;
    }
  }
  switch (jobType) {
    case "terraform":
      return config.terraform_plan_config;
    case "tfmigrate":
      return config.tfmigrate_plan_config;
  }
};

export const setValues = (name: string, values: Array<any>): void => {
  for (const value of values) {
    if (value != undefined) {
      core.setOutput(name, value);
      return;
    }
  }
};

export const setOutputs = (
  keys: Array<string>,
  objs: Array<any>,
): Map<string, any> => {
  const outputs = new Map<string, any>();
  for (const key of keys) {
    for (const obj of objs) {
      if (obj != undefined && obj != null && obj[key] != undefined) {
        outputs.set(key, obj[key]);
        break;
      }
    }
  }
  return outputs;
};

type HasEnv = {
  env?: Record<string, string>;
};

export const setEnvs = (
  ...objs: Array<HasEnv | undefined>
): Map<string, any> => {
  const envs = new Map<string, any>();
  for (const obj of objs) {
    if (obj?.env) {
      for (const [key, value] of Object.entries(obj.env)) {
        envs.set(key, value);
      }
    }
  }
  return envs;
};

export type Target = {
  target: string;
  workingDir: string;
  group?: TargetGroup;
};

export const getTargetGroup = async (
  config: Config,
  target?: string,
  workingDir?: string,
): Promise<Target> => {
  if (workingDir) {
    const targetConfig = getTargetFromTargetGroupsByWorkingDir(
      config.target_groups,
      workingDir,
    );
    target = workingDir;
    for (const pattern of config.replace?.patterns ?? []) {
      target = target.replace(new RegExp(pattern.regexp), pattern.replace);
    }
    if (targetConfig?.target !== undefined) {
      target = workingDir.replace(
        targetConfig.working_directory,
        targetConfig.target,
      );
    }
    return {
      target: target,
      workingDir: workingDir,
      group: targetConfig,
    };
  }

  if (target === undefined) {
    throw new Error(
      "Either TFACTION_TARGET or TFACTION_WORKING_DIR is required",
    );
  }

  const out = await exec.getExecOutput("git", ["ls-files"], {
    silent: true,
  });
  const wds: string[] = [];
  const files = await listWorkingDirFiles(
    config.working_directory_file ?? "tfaction.yaml",
  );
  for (const file of files) {
    wds.push(path.dirname(file));
  }
  const m = createWDTargetMap(wds, config);
  for (const [wd, t] of m) {
    if (t === target) {
      workingDir = wd;
      break;
    }
  }
  if (workingDir === undefined) {
    workingDir = target;
  }
  const targetConfig = getTargetFromTargetGroupsByWorkingDir(
    config.target_groups,
    workingDir,
  );
  return {
    target: target,
    workingDir: workingDir,
    group: targetConfig,
  };
};

export const listWorkingDirFiles = async (file: string): Promise<string[]> => {
  const out = await exec.getExecOutput("git", ["ls-files"], {
    silent: true,
  });
  const files: string[] = [];
  for (const line of out.stdout.split("\n")) {
    if (line.endsWith(file)) {
      files.push(line);
    }
  }
  return files;
};

type Issue = {
  url: string;
  number: number;
  state: string;
  title: string;
  target: string;
};

export const createIssue = async (
  target: string,
  ghToken: string,
  repoOwner: string,
  repoName: string,
): Promise<Issue> => {
  const octokit = github.getOctokit(ghToken);
  const body = `
  This issus was created by [tfaction](https://suzuki-shunsuke.github.io/tfaction/docs/).
  
  About this issue, please see [the document](https://suzuki-shunsuke.github.io/tfaction/docs/feature/drift-detection).
  `;

  const issue = await octokit.rest.issues.create({
    owner: repoOwner,
    repo: repoName,
    title: `Terraform Drift (${target})`,
    body: body,
  });
  return {
    url: issue.data.html_url,
    number: issue.data.number,
    title: issue.data.title,
    target: target,
    state: issue.data.state,
  };
};

export const checkDriftDetectionEnabled = (
  cfg: Config,
  targetGroup: TargetGroup | undefined,
  wdCfg: TargetConfig,
): boolean => {
  if (wdCfg.drift_detection) {
    return wdCfg.drift_detection.enabled ?? true;
  }
  if (targetGroup?.drift_detection) {
    return targetGroup.drift_detection.enabled ?? true;
  }
  return cfg.drift_detection?.enabled ?? false;
};
